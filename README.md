# eats-systems-tech.github.io

Static multilingual site structure:

- Source templates live under `templates/`.
- Published localized pages are generated into `/`, `/he/`, `/es/`, `/fr/`, and the other language-code folders.
- Use language codes for URLs, not country codes. Example: `/he/`, not `/il/`.
- Niche/use-case page content (per locale) lives in `scripts/niche-pages/<locale>.mjs`; shared niche config (slugs, images, legacy redirects) is in `scripts/niche-pages/index.mjs`.
- Rebuild all localized pages with `npm run build:locales`.
- Regenerate optimized niche images (hero/card webp + og jpg) with `npm run build:images` after replacing a source PNG in `assets/wifigate_niche_pages/`.
- Verify the generated site (SEO metadata, links, redirects, sitemap) with `node scripts/verify-site.mjs`.

## WiFiGate Invitation Redirect Contract

`templates/wifigate-link.template.html` treats the encrypted `ep` invitation
payload as opaque and forwards the complete query string to the mobile deep
link. The mobile payload may contain the `ao` user capability (`1` enabled,
`0` disabled, missing means enabled). The website must not decrypt, remove, or
rewrite that field. Legacy verbose query parameters, including `ao`, are also
preserved by the same pass-through behavior.

## WIFIGATE Host portal

The shared site header includes a Login button backed by Firebase Authentication.
`/login/` offers Google and Apple sign-in. After sign-in, `/dashboard/` requests
`GET /v1/me` with the Firebase ID token and renders the admin or client viewer
according to the server response. It then fetches the matching read-only portal
endpoints. Client API keys and WIFIGATE Host KEY values are never sent by the browser.

Set the Web app values (`apiKey`, `authDomain`, `projectId`, `appId`) in
`js/firebase-config.js` using the **same Firebase project** as the WiFiGate app.
Set the deployed management API origin in `js/host-api-config.js`.
In Firebase Authentication, enable the Google and Apple providers and add
`wifigate.io` and any local test host (for example `localhost` or `127.0.0.1`)
to Authorized domains. Apple also needs its Web Services ID and Firebase auth
handler return URL configured in Apple Developer and Firebase Console.

For an end-to-end check, open `/login/`, sign in with a test account, and verify
that `/dashboard/` loads the expected role and memberships from `/v1/me`. Check
the Keys/Usage view for a client account and Clients/Usage/Audit for an admin.
Refresh the page to check session restoration, then sign out and confirm the
dashboard returns to `/login/`. Run `node --test scripts/host-portal.test.mjs`
for the local auth-header and role-mapping checks.

The backend copy currently contains only `POST /v1/guest-invitations`; the
management endpoints listed in `docs/WIFIGATE_HOST.html` are still pending.
The dashboard shows an unavailable state until they are deployed. The site also
requires a Firebase Web app configuration before provider sign-in can run.

### Local staging

Run `npm install`, then `npm run staging`. Open
`http://127.0.0.1:8100/login/`. This starts the Firebase Authentication
Emulator on port 9099, a local management API on port 8101, and the site on
port 8100. Only the site served from port 8100 uses the demo Firebase project;
the normal site continues to require production Web configuration.

In the Firebase mock Google or Apple popup, use one of these emails:

- `admin@wifigate.test` — platform admin, clients, usage, audit.
- `owner@grandplaza.test` — client owner, two keys and usage.
- `member@grandplaza.test` — client member, one assigned key and usage.
- Any other email — signed in, but denied portal access.

Run `npm run test:staging` on its own. It starts staging when needed, tests the
Firebase ID tokens and API permissions, then opens Chrome and follows the site
through Home → Login → mock Google/Apple popup → Dashboard → sign-out → Login.
It checks Admin, Owner, Member and denied access, then stops the staging services
it started. Set `STAGING_HEADLESS=1` for an invisible browser run (or use `CI=true`).
The test uses separate `-e2e` accounts so it does not affect the manual personas.
Staging data is illustrative, kept in memory, and reset on restart. The local
OAuth popup tests Firebase's emulated provider flow; real Google/Apple
configuration and production backend integration still need separate checks.
