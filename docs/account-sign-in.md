# Account sign-in

Preview: https://feature-account-sign-in-gridiron-legends.jacobchapman3.workers.dev/

- Google sign-in opens in the same browser tab and returns to the in-game Account dialog.
- Email/password supports password-manager autofill and a checked-by-default Keep me signed in option.
- New email accounts verify ownership once using an email code. Routine password sign-in does not send a code.
- Forgot password uses the enabled Neon email-OTP recovery endpoints. Email-code sign-in remains an optional fallback.
- No existing accounts or saves are removed. Guest uploads still require the player's explicit action.

The named preview uses the existing isolated cloud-saves-preview Neon branch (`br-dry-tree-ayk55vk0`), not production. This preview's exact origin was added to that branch's trusted origins. Email/password and shared Google OAuth were already enabled. Other preview URLs retain their existing routing.

## Session handling

Only explicit auth routes and fields are forwarded. Google provider and callback URLs are fixed server-side. OAuth completion exchanges Neon's verifier only alongside its HttpOnly session-challenge cookie, following the published Neon SDK's middleware flow. The verifier is exchanged server-side, then removed by a same-origin redirect. Session tokens are stripped from JSON. Cookies keep Secure, HttpOnly, expiration and Max-Age; domain/path are scoped to the game and SameSite=Lax supports the cross-site Google return. The proxy identifies itself using Neon's middleware header. Cloud writes still require verified email and matching account ownership.

Persistent sessions last as long as Neon's issued session permits. They do not survive signing out, browser storage clearing, or switching game hostnames. No passwords or OAuth verifiers are stored in localStorage.

## Release and testing

Use this stable preview URL for account testing. Google's shared development credentials show Neon branding. Before a public production release, configure a Gridiron Legends Google OAuth client in Neon and add the production branch's exact `/callback/google` URL in Google Cloud. No production auth settings were changed.

Automated tests cover proxy validation, redirect allowlisting, challenge-bound exchange, cookie flags, token redaction, verified ownership, account/guest isolation, mobile form layout, password sign-in and reload, verification, recovery, and simulated Google return/cancellation. A real Google authorization, email delivery, phone restart, and second-device cloud restore still require manual testing. Test stubs do not claim those checks.
