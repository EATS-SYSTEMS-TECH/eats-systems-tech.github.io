# eats-systems-tech.github.io

Reservation integrations let owner/admin members map provider room IDs to canonical properties, rooms and active access targets. Operations members can inspect provider processing status and explicitly replay a reviewed dead-letter event. Guest payloads and encrypted event contents are not exposed in the operations view. Desktop and mobile browser tests save a provider mapping against the real Host routes and isolated Firestore emulator.

The Host portal now manages organizations, physical system ownership, reservation calendars and signed guest access. The API integrations section lets owner/admin members create scoped client keys, rotate them with up to 24 hours of overlap and revoke them. Only owners can explicitly reveal a private key after TOTP and recent sign-in; secrets are removed from the page when hidden or the organization/session changes. The backend enforces every permission independently. Desktop and mobile browser tests exercise key creation, disclosure/hiding, rotation and revocation against Host HTTP routes and the isolated Firestore emulator.

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

This repository is the frontend; `D:/Projects/wifigate_host` is the authoritative backend. The shared sign-in pages are `/login/` (English) and `/he/login/` (Hebrew, RTL). Language comes from the URL and is not persisted. Google/Apple authentication, redirect fallback, session restoration and TOTP challenges call read-only `GET /api/v1/platform/me`; signing in does not create Host access or a Host profile.

`/dashboard/` always displays the Host | Pay | Manager picker, including when only one product is active. Each tile uses its server state: `active`, `pending`, `no-plan`, `blocked`, `mfa-required`, or `unavailable`. Product outages do not disable other tiles. A platform outage hides the tiles and offers retry while retaining Firebase authentication. Unenrolled administrators can enroll and verify TOTP directly from this picker. Optional authenticator setup is available for verified users.

The existing Host calendar moved to `/dashboard/host/`. Only after checking active Host access does it read `GET /api/v1/users/me`; a missing approved profile is synchronized with the existing empty `PUT /api/v1/users/me` contract. `/dashboard/pay/` and `/dashboard/manager/` are access-checked empty workspaces, with `/pay/` and `/manager/` as aliases; payments and remote gate operations are not implemented by these shells. Product switchers list all three products and disable inaccessible ones. Host organizations and memberships continue to come from the authorized Host APIs.

Relative `next` links support the existing `/dashboard/host/`, `/dashboard/pay/` and `/dashboard/manager/` pages, including their query and fragment. External URLs, encoded path separators, traversal and unimplemented nested routes are discarded. A supported link resumes only if the server reports the product active. Nested domain pages such as `/dashboard/pay/transactions/1` remain unavailable until those screens and routes are implemented; sign-in falls back to the picker. Sessions use Firebase tab persistence and end after 30 idle minutes or HTTP401. Access-denial403 clears the current workspace and returns to the picker for fresh states. Recent-authentication errors preserve the action's recovery message; resource-specific rejections remain in their action view, and revoked support approval clears prior diagnostics. Stale organization responses cannot clear a newer workspace. Language, product access, roles and TOTP secrets are never cached in browser storage. The backend remains responsible for authorization on every request.

The dashboard contains administrator access management, account/security controls, organization/property/room/team management, secure system inventory, and a live reservation calendar. Inventory validates Host keys, displays only safe preview metadata/fingerprints, connects all physical gates atomically, chooses from the 31 specified SVG icons, and supports disable, rotation and approved organization transfer. The key input is masked and cleared after validation, with no browser storage. The calendar supports week/two-week/three-week/month views, filters/search, and create/edit/cancel/complete with explicit property timezones and DST disambiguation. Calendar is the landing screen. A real organization selector scopes the workspace; accounts without membership or properties see actionable empty states. Account security and portal admin controls are in Settings. Navigation opens individual authorized views, including Properties, Reservations, Guests, Staff, Access Keys, Automation, Jobs Calendar and draft Invoices. Reservations open in a modal side drawer; viewers cannot save changes. Switching organizations discards late responses from the previous tenant. The backend enforces tenant permissions, version conflicts, overlap prevention and retry safety; stale-session responses are discarded. Organization administration requires TOTP. Pending, denied, unavailable, mandatory enrollment and MFA verification states hide protected content.

The authentication contract and setup requirements are in [docs/host-portal-v1.md](docs/host-portal-v1.md). The backend implements authorization/MFA fields, access lifecycle, and tenant endpoints under `/api/v1/organizations`; its README is the complete endpoint registry. Missing authorization fields fail closed.

### Calendar workspace

The reference image belongs to the specification; the dashboard renders interactive calendar elements instead of an image. Tenant management uses the authenticated API adapter in `api/host/portal-request.ts`; no product data is read directly from Firestore. The Host emulator suite exercises the actual portal against Firestore for organization, property, room and team lifecycle at desktop and mobile widths.

### Configuration and build

Public Firebase Web configuration is in js/firebase-config.js (eats-wifigate). The backend must verify tokens for that same project. Enable Google and Apple in Firebase, authorize the site domains, and configure Apple's Web Services ID and Firebase handler return URL. Apple private keys belong in Firebase/server configuration, never in this repository's browser code.

TOTP requires Firebase Authentication with Identity Platform and project-level TOTP activation. The UI generates QR codes locally with a vendored MIT QR encoder; no setup secret goes to a QR service, application API, browser storage, or logs. There is no public role assignment or MFA recovery endpoint in the frontend.

Axios endpoints live in api/auth/ and share api/api.ts. After editing portal source, run npm run build:api to regenerate js/api/index.js and js/host-dashboard.bundle.js. The HTML uses a versioned dashboard bundle to avoid stale module mixtures; public Host configuration remains an external runtime module for isolated emulator overrides. npm run dev performs that build and serves the normal site on port 8000; it is not needed for each edit.

The canonical production API is `https://api.wifigate.io`. All local API clients use `http://127.0.0.1:8001` when the site runs on port 8000; staging 8100 uses API 8101. Configuration lives in `js/host-api-config.js`. CORS must allow the exact frontend origin and the required GET/PUT/POST/DELETE methods, with Authorization, Content-Type and Idempotency-Key headers. The application does not send a Cache-Control request header.

### Checks

Dependency review updated the development Firebase Admin dependency and scoped vulnerable transitive versions. Production dependency audit reports no known advisories. Five development-tool advisories remain in the unpatched file-watcher and OpenTelemetry/PubSub chains; the detailed assessment is in backend `docs/decisions/0004-shared-platform-access.md`. These tools are not shipped in the browser bundles.

- npm run test:api: TypeScript build and access/API unit tests.
- npm run test:platform: isolated browser checks for bilingual login, product states, MFA, redirects, idle expiry and401/403 cleanup; no cloud credentials or production data.
- npm run test:staging: Auth Emulator token/API tests, mock Google/Apple browser flows, and isolated browser fixtures for TOTP enrollment/challenges/approval.
- node scripts/host-portal-browser.test.mjs: browser fixtures against an existing site on port 8100; no emulator required for this fixture suite.

Staging is entirely local. Approved user fixtures: owner@grandplaza.test and member@grandplaza.test. admin@wifigate.test is an admin without TOTP and must remain in enrollment. pending@wifigate.test is pending; other emails are denied. These names are fixtures, not a production allowlist.

The Auth Emulator does not provide a production TOTP acceptance test. The fixture suite exercises SDK call ordering, invalid codes, admin enrollment and verified-session gates, optional user enrollment, revoked access, error states, logout, and responsive live/empty calendar workspace rendering. Real Google/Apple configuration, production backend authorization, real authenticator enrollment, and real organization onboarding require production acceptance before release.
# Host automation controls

The Host portal now includes owner/admin property automation settings: explicit enablement, bounded early access/late expiry, generate-only or configured partner delivery. Load settings before saving so writes carry their current revision. Staff can view bounded job status and audit-reason retries for failed/paused jobs. The page displays delivery receipt identifiers and the offline expiry warning, without listing private links or guest details in operational rows. All actions use the live Host authorization and idempotency contracts.

The Host dashboard uses the supplied WIFIGATE visual reference: navy sidebar navigation to actual authorized sections, blue actions, collapsible property groups and reservation cards spanning local calendar dates. Same-day turnover cards occupy separate lanes; midnight departure remains exclusive. On phones the navigation becomes a horizontal strip and the timeline scrolls without expanding the page. `npm run test:dashboard` checks this workspace with isolated data and a headless Chrome browser; `npm run test:api` covers clipping, overlapping visual spans and DST boundaries. The document image remains a design reference. The dashboard contains no static calendar placeholder.
