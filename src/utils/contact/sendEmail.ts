// utils/contact/sendEmail.ts
import { FormData } from "@/components/contact/ContactForm";

export async function sendEmail(data: FormData, { timeoutMs = 15000 } = {}) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: ctrl.signal,
    });

    const raw = await res.text();
    const payload = raw ? safeJson(raw) : null;

    if (!res.ok) {
      const message =
        payload?.error ||
        payload?.message ||
        `Failed to send email (HTTP ${res.status})`;
      throw new Error(message);
    }

    return payload ?? { message: "Email sent successfully." };
  } finally {
    clearTimeout(id);
  }
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
