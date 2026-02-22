// src/app/api/contact/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

// ---- Config ----
const ALLOWED_ORIGINS = new Set([
  "https://triko.ge",
  "https://www.triko.ge",
  "http://localhost:3000",
]);

// Simple in-memory rate limit (good baseline; for multi-instance use Redis/Upstash)
const ipHits = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_PER_WINDOW = 5;

// ---- Schema ----
const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  message: z.string().min(10).max(2000),
  hp: z.string().optional(), // honeypot
  ts: z.string().optional(), // client timestamp for "minimum time" anti-bot
});

function getIP(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimit(req: Request) {
  const ip = getIP(req);
  const now = Date.now();
  const cur = ipHits.get(ip);

  if (!cur || now - cur.ts > WINDOW_MS) {
    ipHits.set(ip, { count: 1, ts: now });
    return { ok: true };
  }

  if (cur.count >= MAX_PER_WINDOW) return { ok: false };

  cur.count += 1;
  ipHits.set(ip, cur);
  return { ok: true };
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(req: Request) {
  try {
    // --- Basic origin gate (cheap CSRF/abuse protection) ---
    const origin = req.headers.get("origin");
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // --- Rate limit ---
    if (!rateLimit(req).ok) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    // --- Env checks ---
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Server misconfigured (missing RESEND_API_KEY)." },
        { status: 500 }
      );
    }

    const to = process.env.CONTACT_TO_EMAIL;
    const from = process.env.CONTACT_FROM_EMAIL;

    if (!to || !from) {
      return NextResponse.json(
        { error: "Server misconfigured (missing CONTACT_TO_EMAIL/CONTACT_FROM_EMAIL)." },
        { status: 500 }
      );
    }

    // --- Parse + validate ---
    const body = await req.json().catch(() => null);
    const parsed = ContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
    }

    const { name, email, message, hp, ts } = parsed.data;

    // --- Honeypot ---
    if (hp && hp.trim().length > 0) {
      // pretend success so bots can't learn
      return NextResponse.json({ message: "Message sent!" }, { status: 200 });
    }

    // --- Minimum time anti-bot (block super-fast submits) ---
    // If they submitted in under 2 seconds, treat as bot (silent success)
    const sentAt = ts ? Number(ts) : null;
    if (sentAt && Number.isFinite(sentAt) && Date.now() - sentAt < 2000) {
      return NextResponse.json({ message: "Message sent!" }, { status: 200 });
    }

    // --- Email content ---
    const subject = `Triko Contact · ${name}`;

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system; line-height: 1.5;">
        <h2 style="margin:0 0 12px;">New Contact Message</h2>
        <p style="margin:0 0 6px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="margin:0 0 6px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
        <div style="margin-top:12px; padding:12px; border:1px solid #e5e7eb; border-radius:12px;">
          <p style="margin:0; white-space:pre-wrap;">${escapeHtml(message)}</p>
        </div>
      </div>
    `;

    const { error } = await resend.emails.send({
      from, // e.g. "Triko <no-reply@triko.ge>"
      to, // e.g. "info@triko.ge"
      subject,
      replyTo: email,
      html,
    });

    if (error) {
      console.error("Resend send error:", error);
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ message: "Message sent!" }, { status: 200 });
  } catch (e) {
    console.error("Contact route error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
