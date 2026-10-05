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

The frontend uses Firebase Google/Apple authentication, including redirect callback handling, session restoration, logout, and TOTP challenges. It synchronizes the profile with an empty PUT /api/v1/users/me and reads authorization from GET /api/v1/users/me. A profile alone never grants portal access.

The dashboard contains administrator access management, account/security controls, organization/property/room/team management, secure system inventory, and a live reservation calendar. Inventory validates Host keys, displays only safe preview metadata/fingerprints, connects all physical gates atomically, chooses from the 31 specified SVG icons, and supports disable, rotation and approved organization transfer. The key input is masked and cleared after validation, with no browser storage. The calendar supports week/two-week/three-week/month views, filters/search, and create/edit/cancel/complete with explicit property timezones and DST disambiguation. Calendar is the landing screen. A real organization selector scopes the workspace; accounts without membership or properties see actionable empty states. Account security and portal admin controls are in Settings. Navigation opens individual authorized views, including Properties, Reservations, Guests, Staff, Access Keys, Automation, Jobs Calendar and draft Invoices. Reservations open in a modal side drawer; viewers cannot save changes. Switching organizations discards late responses from the previous tenant. The backend enforces tenant permissions, version conflicts, overlap prevention and retry safety; stale-session responses are discarded. Organization administration requires TOTP. Pending, denied, unavailable, mandatory enrollment and MFA verification states hide protected content.

The authentication contract and setup requirements are in [docs/host-portal-v1.md](docs/host-portal-v1.md). The backend implements authorization/MFA fields, access lifecycle, and tenant endpoints under `/api/v1/organizations`; its README is the complete endpoint registry. Missing authorization fields fail closed.

### Calendar workspace

The reference image belongs to the specification; the dashboard renders interactive calendar elements instead of an image. Tenant management uses the authenticated API adapter in `api/host/portal-request.ts`; no product data is read directly from Firestore. The Host emulator suite exercises the actual portal against Firestore for organization, property, room and team lifecycle at desktop and mobile widths.

### Configuration and build

Public Firebase Web configuration is in js/firebase-config.js (eats-wifigate). The backend must verify tokens for that same project. Enable Google and Apple in Firebase, authorize the site domains, and configure Apple's Web Services ID and Firebase handler return URL. Apple private keys belong in Firebase/server configuration, never in this repository's browser code.

TOTP requires Firebase Authentication with Identity Platform and project-level TOTP activation. The UI generates QR codes locally with a vendored MIT QR encoder; no setup secret goes to a QR service, application API, browser storage, or logs. There is no public role assignment or MFA recovery endpoint in the frontend.

Axios endpoints live in api/auth/ and share api/api.ts. After editing portal source, run npm run build:api to regenerate js/api/index.js and js/host-dashboard.bundle.js. The HTML uses a versioned dashboard bundle to avoid stale module mixtures; public Host configuration remains an external runtime module for isolated emulator overrides. npm run dev performs that build and serves the normal site on port 8000; it is not needed for each edit.

Local API requests go to http://127.0.0.1:8001. Local staging uses port 8101. The deployed portal uses the verified Cloud Run HTTPS service origin; api.wifigate.io also serves the backend through its custom-domain mapping. Set the origin in js/host-api-config.js. CORS must permit the site origin, GET/PUT/POST, and Authorization, Content-Type, Cache-Control, and Idempotency-Key headers.

### Checks

- npm run test:api: TypeScript build and access/API unit tests.
- npm run test:staging: Auth Emulator token/API tests, mock Google/Apple browser flows, and isolated browser fixtures for TOTP enrollment/challenges/approval.
- node scripts/host-portal-browser.test.mjs: browser fixtures against an existing site on port 8100; no emulator required for this fixture suite.

Staging is entirely local. Approved user fixtures: owner@grandplaza.test and member@grandplaza.test. admin@wifigate.test is an admin without TOTP and must remain in enrollment. pending@wifigate.test is pending; other emails are denied. These names are fixtures, not a production allowlist.

The Auth Emulator does not provide a production TOTP acceptance test. The fixture suite exercises SDK call ordering, invalid codes, admin enrollment and verified-session gates, optional user enrollment, revoked access, error states, logout, and responsive live/empty calendar workspace rendering. Real Google/Apple configuration, production backend authorization, real authenticator enrollment, and real organization onboarding require production acceptance before release.
# Host automation controls

The Host portal now includes owner/admin property automation settings: explicit enablement, bounded early access/late expiry, generate-only or configured partner delivery. Load settings before saving so writes carry their current revision. Staff can view bounded job status and audit-reason retries for failed/paused jobs. The page displays delivery receipt identifiers and the offline expiry warning, without listing private links or guest details in operational rows. All actions use the live Host authorization and idempotency contracts.

The Host dashboard uses the supplied WIFIGATE visual reference: navy sidebar navigation to actual authorized sections, blue actions, collapsible property groups and reservation cards spanning local calendar dates. Same-day turnover cards occupy separate lanes; midnight departure remains exclusive. On phones the navigation becomes a horizontal strip and the timeline scrolls without expanding the page. `npm run test:dashboard` checks this workspace with isolated data and a headless Chrome browser; `npm run test:api` covers clipping, overlapping visual spans and DST boundaries. The document image remains a design reference. The dashboard contains no static calendar placeholder.
