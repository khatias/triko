import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { z } from "zod";

export const runtime = "nodejs";

const ContactSchema = z.object({
  name: z.string().trim().min(2, "Name too short").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email").max(254),
  message: z
    .string()
    .trim()
    .min(10, "Message too short")
    .max(2000, "Message too long"),
  hp: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 422 } // correct way
      );
    }

    if (parsed.data.hp && parsed.data.hp.length > 0) {
      return NextResponse.json({ message: "OK" }); // silently accept bots
    }

    const { email, name, message } = parsed.data;

    const USER = process.env.MY_EMAIL;
    const PASS = process.env.MY_PASSWORD;
    if (!USER || !PASS) {
      console.error("Missing MY_EMAIL or MY_PASSWORD");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: USER, pass: PASS },
    });

    const mailOptions: Mail.Options = {
      from: USER,
      to: USER,
      subject: `Message from ${name} (${email})`,
      text: message,
      replyTo: email,
    };

    await new Promise<void>((resolve, reject) => {
      transport.sendMail(mailOptions, (err) => (err ? reject(err) : resolve()));
    });

    return NextResponse.json({ message: "Email sent" });
  } catch (err: unknown) {
    console.error("contact_api_error:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
