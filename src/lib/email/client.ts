import { Resend } from "resend";

// Lazy-init so missing RESEND_API_KEY doesn't crash module load.
// Callers that get null must skip sending and treat it as a non-fatal
// "email not configured" condition (AC#5: must not block submission).
let cachedClient: Resend | null = null;
let cacheKey: string | undefined;

export function getEmailClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  if (!cachedClient || cacheKey !== apiKey) {
    cachedClient = new Resend(apiKey);
    cacheKey = apiKey;
  }
  return cachedClient;
}
