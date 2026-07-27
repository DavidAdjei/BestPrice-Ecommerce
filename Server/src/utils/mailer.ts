import nodemailer from "nodemailer";

// Uses standard SMTP env vars so any provider works (Gmail app password,
// SendGrid, Mailgun, Resend's SMTP endpoint, etc.) — nothing provider-specific.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

const FROM = process.env.SMTP_FROM ?? "Best Price <no-reply@bestprice.local>";

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!process.env.SMTP_HOST) {
    // No SMTP configured (e.g. local dev without credentials) — log
    // instead of throwing, so the rest of the flow (signup, order
    // updates) isn't blocked on email delivery being set up.
    console.log(`[email skipped — no SMTP_HOST set] to=${to} subject="${subject}"`);
    return;
  }
  await transporter.sendMail({ from: FROM, to, subject, html });
};

export const sendVerificationEmail = async (to: string, firstName: string, token: string) => {
  const link = `${process.env.CLIENT_SIDE_URL}/verify-email?token=${token}`;
  await sendEmail(
    to,
    "Verify your Best Price email",
    `<p>Hi ${firstName},</p><p>Confirm your email to finish setting up your account:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`
  );
};

export const sendPasswordResetEmail = async (to: string, firstName: string, token: string) => {
  const link = `${process.env.CLIENT_SIDE_URL}/reset-password?token=${token}`;
  await sendEmail(
    to,
    "Reset your Best Price password",
    `<p>Hi ${firstName},</p><p>Reset your password using the link below. If you didn't request this, you can ignore this email.</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour.</p>`
  );
};

export const sendOrderStatusEmail = async (
  to: string,
  firstName: string,
  orderId: string,
  status: string
) => {
  await sendEmail(
    to,
    `Your Best Price order is now ${status.toLowerCase()}`,
    `<p>Hi ${firstName},</p><p>Your order <strong>#${orderId.slice(-8)}</strong> status was updated to <strong>${status}</strong>.</p>`
  );
};
