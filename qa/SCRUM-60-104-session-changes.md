# SCRUM-60 + SCRUM-104 — Session changes

**Date:** 2026-05-04
**Branch:** `scrum-42-consultation-bookings`
**Scope:** Unblock and verify backend for consultation booking flow.

---

## Starting state

`npm run dev` was failing with three runtime errors on any request to `/api/admin/consultation-bookings`:

1. `Export createAdminClient doesn't exist in target module` — `src/lib/supabase/admin.ts` was 0 bytes (empty placeholder from the SCRUM-60 scaffold commit).
2. `Export getCurrentAdmin doesn't exist in target module` — `src/controllers/authController.ts` only exported `loginAdmin`, and that function was incomplete (signed in but never returned).
3. Auth bearer header in `src/lib/supabase/server.ts` used single quotes instead of backticks, so `${accessToken}` was sent literally.

In addition, `@supabase/supabase-js` was missing from `package.json` and `package-lock.json`, and the SCRUM-42 SQL migration file was 0 bytes despite being committed.

---

## Code changes

### `src/lib/supabase/admin.ts` — implemented

Was 0 bytes. Added `createAdminClient()`:

- Reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from env.
- Throws if either env var is missing.
- Returns a Supabase client with `autoRefreshToken: false`, `persistSession: false` (server-only, bypasses RLS via service-role key).

### `src/controllers/authController.ts` — completed

- **Finished `loginAdmin`**: after `signInWithPassword` succeeds, looks up the admin profile via `getAdminByUserId`. Throws `403 "Not an authorised admin"` if the Supabase user is not registered in `admin_profiles`. Returns `{ user, access_token, refresh_token }`.
- **Added `getCurrentAdmin(token)`**: verifies the bearer token with `supabase.auth.getUser(token)`, then fetches the admin profile. Throws `401` for invalid/expired tokens, `403` for non-admin Supabase users. This is what `withAdminAuth` calls on every protected request.

### `src/lib/supabase/server.ts` — bug fix

Line 18: `'Bearer ${accessToken}'` → `` `Bearer ${accessToken}` ``. Single quotes meant the token wasn't being interpolated into the header.

### Commit

All three changes shipped in commit `5604ecb` on `claude/adoring-ride-68aa74`, then merged via `--no-ff` (commit `2097564`) into `scrum-42-consultation-bookings`.

---

## Infrastructure / dependency changes

### Added `@supabase/supabase-js` to dependencies

Ran `npm install @supabase/supabase-js` in `C:\Users\lexib\Desktop\Flooring`. Updated `package.json` and `package-lock.json`.

### Wrote `sql/scrum42-consultation-bookings.sql`

File was committed empty in `4f869b5`. Filled in based on the schema implied by `src/models/consultationBookingModel.ts`:

- `consultation_bookings` table with all columns the model touches (`id`, `full_name`, `email`, `preferred_date`, `preferred_time`, `project_summary`, `referral_source`, `status`, `admin_notes`, `created_at`, `updated_at`).
- `status` defaults to `'pending'` with a CHECK constraint enforcing the four allowed values (matches AC#2 of SCRUM-104).
- Indexes on `status` (admin filter) and `created_at DESC` (admin list ordering).
- RLS enabled — all reads/writes go through the service-role key which bypasses RLS, but enabling it ensures the anon key cannot touch this table directly.
- `updated_at` auto-bump trigger reuses the `update_updated_at()` function defined in `sql/supabase-setup.sql`.

Committed as `4d53b0f` ("SCRUM-42: add consultation_bookings migration (was missing)").

### `.gitignore` — added safety rules

Added two lines under the env files section:
```
qa/*.http
qa/probe.tmp
```
Prevents accidental commit of `qa/scrum-104.http`, which contains a plaintext admin password.

---

## Database changes (done by Alexia in Supabase dashboard)

- Ran `sql/supabase-setup.sql` (creates `admin_profiles` table + trigger).
- Ran `sql/scrum42-consultation-bookings.sql` (creates `consultation_bookings` table).
- Created auth user `lexibarbara6@gmail.com` via Authentication → Users.
- Inserted matching row into `admin_profiles` with `role = 'super_admin'`, `user_id = 61551ece-be72-4597-bfb6-5a7e3985c546`.
- Populated `.env.local` at project root with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## SCRUM-104 verification artefact

### `qa/scrum-104.http` — new file

REST Client (`humao.rest-client` VS Code extension) test file covering all 8 SCRUM-104 ACs end-to-end:

1. Login → Supabase `/auth/v1/token` (no `/api` login route exists yet — that's deferred SCRUM-60 frontend work).
2. AC#3 — POST with invalid email → 400.
3. AC#4 — POST with past date → 400.
4. AC#1 — POST valid → 201.
5. AC#6 — Admin GET no auth → 401.
6. AC#5 + AC#2 — Admin GET with auth → 200 + row has `status: "pending"`.
7. AC#7a — PATCH empty body → 400.
8. AC#7b — PATCH with `status` + `admin_notes` → 200.
9. AC#8 — DELETE → 200, then GET → 404.

REST Client variable chaining (`{{login.response.body.$.access_token}}`, `{{listBookings.response.body.$.bookings[0].id}}`) avoids manual copy-paste of tokens and IDs between requests.

### Verification result

All 8 ACs **passed** end-to-end on 2026-05-04 after one operational hiccup: the dev server's Turbopack worker crashed mid-test (`"Jest worker encountered 2 child process exceptions"`). Resolved by `taskkill /PID <next-dev>`, deleting `.next/`, and `npm run dev` for a clean compile.

---

## Pre-existing issues flagged (not fixed in this session)

- **`sql/scrum38-qualifying-sessions.sql` is 0 bytes.** Same pattern as SCRUM-42 — committed empty. Whoever owns SCRUM-38 verification will hit this.
- **All other admin route files in `src/app/api/admin/{products,attributes,...}` are 0 bytes.** Means the SCRUM-104 caveat ("Confirm withAdminAuth wrapping pattern matches existing admin routes") cannot be verified — there are no other implemented admin routes to compare against.
- **No `/api/admin/auth/login` route handler exists.** `loginAdmin` controller is implemented but no HTTP route exposes it. Tests bypass this by calling Supabase auth directly. Belongs to SCRUM-60 frontend work.
- **Local main checkout has ~20 unstaged files** unrelated to SCRUM-42 (an `app/` → `src/app/` move plus other refactors). Out of scope here — needs team confirmation before commit/discard.

---

## Files touched (summary)

| Path | Change | Status |
|------|--------|--------|
| `src/lib/supabase/admin.ts` | implemented `createAdminClient` | committed `5604ecb` |
| `src/lib/supabase/server.ts` | fixed bearer header backticks | committed `5604ecb` |
| `src/controllers/authController.ts` | finished `loginAdmin`, added `getCurrentAdmin` | committed `5604ecb` |
| `sql/scrum42-consultation-bookings.sql` | wrote schema | committed `4d53b0f` |
| `package.json`, `package-lock.json` | added `@supabase/supabase-js` | uncommitted |
| `.gitignore` | added `qa/*.http`, `qa/probe.tmp` | uncommitted |
| `qa/scrum-104.http` | new test file (gitignored) | uncommitted, not to be committed |
| `qa/SCRUM-60-104-session-changes.md` | this document | uncommitted |
