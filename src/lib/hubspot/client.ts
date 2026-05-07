import { Client } from "@hubspot/api-client";

// Lazy-init so missing HUBSPOT_ACCESS_TOKEN doesn't crash module load.
// Callers that get null must skip syncing — AC#5: failed sync must not
// block the originating submission.
let cachedClient: Client | null = null;
let cacheKey: string | undefined;

export function getHubspotClient(): Client | null {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) return null;

  if (!cachedClient || cacheKey !== accessToken) {
    cachedClient = new Client({ accessToken });
    cacheKey = accessToken;
  }
  return cachedClient;
}
