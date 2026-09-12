# Email accounts and cloud careers

Status: preview implementation. Production promotion awaits email delivery setup and live sign-in verification.

## Player behavior

- Guest careers retain their original keys. Accounts use separate device caches.
- Email one-time codes create/sign in to managed Neon accounts. Session cookies are HttpOnly and proxied through the game origin for Safari.
- Account saves update locally first and sync after three idle seconds or on a thirty-second retry. Network failure retains the pending save.
- First login starts with the account's cloud careers. Upload device careers explicitly copies guest careers, preserving the originals.
- Different device revisions never silently overwrite. Keep both versions makes separate career copies.
- Recovery lists the latest twenty historical save banks and restores copies. Historical rows are currently retained, not automatically deleted.
- An account or save changed in another tab prevents the stale tab from writing.
- Sign-out leaves account caches separate from guest careers; it does not erase unsynced progress. Signing back in can sync it.

## Backend

Project `icy-voice-57464561`; preview branch `br-dry-tree-ayk55vk0`; production branch `br-empty-breeze-ayzkbnzv`.
`db/migrations/0001_cloud_saves.sql` is versioned, applied transactionally to preview and production. Both game domains are registered as trusted origins.
Cloudflare Worker serves `/api/auth/*` and `/api/cloud*`; static assets keep existing routing. Public endpoint addresses are not credentials. No database password is shipped in JavaScript.
Neon Data API verifies its JWT. Functions derive the owner from `auth.user_id()`, serialize writes per owner and require the expected revision. Tables deny client DML. Mutation IDs make retries idempotent.
Auth forwarding accepts only explicit routes, strips session tokens from response JSON, preserves cookie flags and checks the request origin. Cloud requests also require the session's owner to match the device cache owner.

## Verification

Local tests cover account/guest isolation, stale tabs, writes made while sync is in flight, conflict copies, authentication, origin checks, token redaction, and data validation. Real preview database role tests confirmed revision conflict rejection, idempotency, historical recovery and cross-account isolation.
Browser tests stub service responses for mobile layout, email outage and two-device conflict handling. These do not prove real email delivery or iPhone login. GitHub Actions and Cloudflare builds passed for `3ae072f`. The deployed preview account dialog and unauthenticated auth proxy were also checked successfully.

## Before production

1. Configure a dedicated SMTP sender in Neon Auth, then verify an actual code sign-in and sign-out on the public preview, including iPhone Safari. The shared Neon sender is for development/testing and is rate limited.
2. Disable development localhost origins through Neon settings.
3. Verify restore on a second device, offline save and re-login before merging.
4. Preview and production are separate accounts/data. Export any preview careers before switching origins.

No production careers were uploaded, replaced, or deleted by this implementation.
