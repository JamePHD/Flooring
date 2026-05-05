import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("[email] RESEND_API_KEY not set — emails will fail to send");
}

export const resend = new Resend(process.env.RESEND_API_KEY ?? "");

// Centralised business contact info used across templates.
// Falls back to placeholders if env vars aren't set.
export const BUSINESS_INFO = {
  name: "Empirical Flooring",
  email: process.env.BUSINESS_EMAIL ?? "info@empiricalflooring.com.au",
  phone: process.env.BUSINESS_PHONE ?? "+61 X XXXX XXXX",
  website: "https://empiricalflooring.com.au",
};

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@empiricalflooring.com.au";