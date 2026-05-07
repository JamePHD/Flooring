import { XeroClient } from "xero-node";
import { createAdminClient } from "../supabase/admin";
import { getXeroClient } from "./client";

// Refresh access tokens this many seconds before they actually expire,
// so an in-flight request never hits the wire with a stale token.
const REFRESH_BUFFER_SECONDS = 60;

export interface StoredXeroTokens {
  tenant_id: string;
  tenant_name: string | null;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string | null;
  connected_by: string | null;
  connected_at: string;
}

export async function loadStoredTokens(): Promise<StoredXeroTokens | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("xero_tokens")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    console.error("[xero] failed to load tokens:", error.message);
    return null;
  }
  return (data as StoredXeroTokens | null) ?? null;
}

export async function saveTokens(input: {
  tenantId: string;
  tenantName: string | null;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string | null;
  connectedBy: string | null;
}): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("xero_tokens").upsert(
    {
      id: 1,
      tenant_id: input.tenantId,
      tenant_name: input.tenantName,
      access_token: input.accessToken,
      refresh_token: input.refreshToken,
      expires_at: input.expiresAt.toISOString(),
      scope: input.scope,
      connected_by: input.connectedBy,
      connected_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) {
    throw { message: error.message || "Failed to save Xero tokens", status: 500 };
  }
}

export async function clearTokens(): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("xero_tokens").delete().eq("id", 1);
  if (error) {
    throw { message: error.message || "Failed to clear Xero tokens", status: 500 };
  }
}

// Returns a Xero client with a fresh, ready-to-use token set, OR null
// with a reason. Auto-refreshes the access_token if it's within the
// buffer window. Persists the new refresh_token if Xero rotated it.
export async function getActiveXeroClient(): Promise<
  | { ok: true; client: XeroClient; tenantId: string; tenantName: string | null }
  | { ok: false; reason: "not_configured" | "not_connected" | "refresh_failed"; error?: string }
> {
  const client = getXeroClient();
  if (!client) return { ok: false, reason: "not_configured" };

  const stored = await loadStoredTokens();
  if (!stored) return { ok: false, reason: "not_connected" };

  // Check if access token needs refreshing
  const expiresAt = new Date(stored.expires_at);
  const nowPlusBuffer = new Date(Date.now() + REFRESH_BUFFER_SECONDS * 1000);

  let activeAccessToken = stored.access_token;
  let activeRefreshToken = stored.refresh_token;
  let activeExpiresAt = expiresAt;

  if (expiresAt <= nowPlusBuffer) {
    try {
      const newTokenSet = await client.refreshWithRefreshToken(
        process.env.XERO_CLIENT_ID!,
        process.env.XERO_CLIENT_SECRET!,
        stored.refresh_token
      );
      if (!newTokenSet.access_token || !newTokenSet.refresh_token) {
        return {
          ok: false,
          reason: "refresh_failed",
          error: "Refresh response missing tokens",
        };
      }
      activeAccessToken = newTokenSet.access_token;
      activeRefreshToken = newTokenSet.refresh_token;
      activeExpiresAt = new Date(
        Date.now() + (newTokenSet.expires_in ?? 1800) * 1000
      );

      // Persist the rotated refresh_token immediately — old one is dead.
      await saveTokens({
        tenantId: stored.tenant_id,
        tenantName: stored.tenant_name,
        accessToken: activeAccessToken,
        refreshToken: activeRefreshToken,
        expiresAt: activeExpiresAt,
        scope: stored.scope,
        connectedBy: stored.connected_by,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[xero] refresh failed:", msg);
      // 60-day refresh window expired or revoked — admin must reconnect.
      // Wipe the dead row so /status reports correctly.
      await clearTokens().catch(() => undefined);
      return { ok: false, reason: "refresh_failed", error: msg };
    }
  }

  // Hand the fresh token set to the SDK so subsequent .accountingApi
  // calls use it.
  client.setTokenSet({
    access_token: activeAccessToken,
    refresh_token: activeRefreshToken,
    expires_in: Math.floor((activeExpiresAt.getTime() - Date.now()) / 1000),
    token_type: "Bearer",
    scope: stored.scope ?? undefined,
  });

  return {
    ok: true,
    client,
    tenantId: stored.tenant_id,
    tenantName: stored.tenant_name,
  };
}
