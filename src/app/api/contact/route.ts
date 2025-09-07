import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

// Important: nodemailer needs Node.js runtime, not Edge.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email, name, message } = await request.json();

    if (!email || !name || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_PASSWORD,
      },
    });

    const mailOptions: Mail.Options = {
      from: process.env.MY_EMAIL,
      to: process.env.MY_EMAIL,
      subject: `Message from ${name} (${email})`,
      text: message,
      replyTo: email,
    };

    await new Promise<void>((resolve, reject) => {
      transport.sendMail(mailOptions, (err) => (err ? reject(err) : resolve()));
    });

    return NextResponse.json({ message: "Email sent" });
  } catch (err: unknown) {
  const msg =
    err instanceof Error ? err.message : "Failed to send email";
  return NextResponse.json({ error: msg }, { status: 500 });
}

}
