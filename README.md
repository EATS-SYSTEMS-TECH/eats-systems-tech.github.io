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

## WIFIGATE Host V1 portal

The frontend uses Firebase Google/Apple authentication, including redirect callback handling, session restoration, logout, and TOTP challenges. It synchronizes the profile with an empty PUT /api/v1/users/me and reads authorization from GET /api/v1/users/me. A profile alone never grants portal access.

The dashboard contains the Calendar reference image only, an admin email approval form, and account/security controls. It has no live calendar, clients, keys, usage, room management, or other V2 screens. Pending, denied, unavailable, mandatory enrollment, and MFA verification states keep portal content hidden.

The proposed backend contract and setup requirements are in [docs/host-portal-v1.md](docs/host-portal-v1.md). The current local backend only returns the profile; it still needs the authorization/MFA fields and email approval endpoint. Missing fields fail closed.

### Calendar asset

The supplied WIFIGATE_HOST.html references a Calendar image but contains no image attachment. Once the approved image is supplied, add it to assets/img/ and set calendarReferenceUrl in js/host-portal-config.js. The responsive image container is implemented; no replacement calendar or invented reference is shipped.

### Configuration and build

Public Firebase Web configuration is in js/firebase-config.js (eats-wifigate). The backend must verify tokens for that same project. Enable Google and Apple in Firebase, authorize the site domains, and configure Apple's Web Services ID and Firebase handler return URL. Apple private keys belong in Firebase/server configuration, never in this repository's browser code.

TOTP requires Firebase Authentication with Identity Platform and project-level TOTP activation. The UI generates QR codes locally with a vendored MIT QR encoder; no setup secret goes to a QR service, application API, browser storage, or logs. There is no public role assignment or MFA recovery endpoint in the frontend.

Axios endpoints live in api/auth/ and share api/api.ts. After editing TypeScript, run npm run build:api to regenerate js/api/index.js. npm run dev performs that build and serves the normal site on port 8000; it is not needed for each edit.

Local API requests go to http://127.0.0.1:8001. Local staging uses port 8101. The deployed API origin remains https://api.wifigate.io and needs confirmation before deployment. Set the origin in js/host-api-config.js. CORS must permit the site origin, GET/PUT/POST, and Authorization, Content-Type, Cache-Control, and Idempotency-Key headers.

### Checks

- npm run test:api: TypeScript build and access/API unit tests.
- npm run test:staging: Auth Emulator token/API tests, mock Google/Apple browser flows, and isolated browser fixtures for TOTP enrollment/challenges/approval.
- node scripts/host-portal-browser.test.mjs: browser fixtures against an existing site on port 8100; no emulator required for this fixture suite.

Staging is entirely local. Approved user fixtures: owner@grandplaza.test and member@grandplaza.test. admin@wifigate.test is an admin without TOTP and must remain in enrollment. pending@wifigate.test is pending; other emails are denied. These names are fixtures, not a production allowlist.

The Auth Emulator does not provide a production TOTP acceptance test. The fixture suite exercises SDK call ordering, invalid codes, admin enrollment and verified-session gates, optional user enrollment, revoked access, error states, logout, and responsive image rendering with a test-only image. Real Google/Apple configuration, production backend authorization, real authenticator enrollment, and the actual Calendar reference asset require an integration check before release.
