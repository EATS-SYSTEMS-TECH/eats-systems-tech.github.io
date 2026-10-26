# eats-systems-tech.github.io

The login page now uses authenticated `POST /api/v1/platform/login` after Google/Apple sign-in. The backend allows five access refusals in a 15-minute observation window, then blocks that verified identity for 15 minutes from the fifth failure. The page hides the localized failed-attempt counter while it is zero, shows `1/5`–`5/5` after a failure, hides it again on expiry/reset, disables both providers during cooldown, and restores the counter after reload through an anonymous localStorage hint. Server HMAC counters remain authoritative; clearing browser storage cannot reset them. Successful access resets failures. Provider cancellation, MFA/provider errors before authentication and infrastructure outages are not counted. Deploy the matching backend and active `portal_login_attempts.expiresAt` TTL before publishing the login pages. `npm run test:login` builds only the login API client and checks counters, exact hint expiry, blocked storage, five refusals, reload, cooldown, Hebrew mobile layout, localized pages and existing TOTP module behavior. It deliberately does not regenerate unrelated dashboard bundles.

Connect (owners and admins) maps each room of a booking system (`providerRoomId`) to one active WIFIGATE system of the organization (`POST …/integrations/providers/:provider/mappings {providerRoomId, systemId}`), lists the bookings it sent lately and retries one that failed. Guest payloads and encrypted event contents are not exposed in the operations view. The mocked dashboard browser tests (`npm run test:dashboard`) save a mapping and check what each role sees.

The Host portal now manages organizations, physical system ownership, reservation calendars and signed guest access. Connect → API keys lists the organization's keys to owners and admins; only the owner creates scoped keys, rotates them with up to 24 hours of overlap, revokes them and reveals a private key after TOTP and recent sign-in; secrets are removed from the page when hidden or the organization/session changes. The backend enforces every permission independently. The mocked dashboard browser tests cover the owner's create and reveal, the admin's read-only list, and the recent sign-in retry of key writes.

Static multilingual site structure:

The My profile product cards show personal totals instead of subscription on/off preview rows. Counts come from each active product's `summary` on authenticated `GET /api/v1/platform/me`: saved gates, Dual Controls, groups and associated organizations. These are personal assignments, including for platform administrators. Missing/null counts display `—` with an accessible unavailable label; the UI never substitutes global directory counts or fabricates zero. Monthly payment remains explicitly preview data. Live totals require the matching `wifigate_host` additive summary contract.

- Source templates live under `templates/`.
- Published localized pages are generated into `/`, `/he/`, `/es/`, `/fr/`, and the other language-code folders.
- Use language codes for URLs, not country codes. Example: `/he/`, not `/il/`.
- Niche/use-case page content (per locale) lives in `scripts/niche-pages/<locale>.mjs`; shared niche config (slugs, images, legacy redirects) is in `scripts/niche-pages/index.mjs`.
- Landing pages (for example `/he/shabbat-clock-electric-gate/`) live in `scripts/landing-pages/<locale>.mjs`, Hebrew first: use-case pages in every language, with the site header and language menu, outside the use-case list, plus a definition, setup steps, a facts table and FAQ question headings (`fillLandingSections`, `css/landing.css`). The build checks every locale against the Hebrew, including title/description length, and the Hebrew and English for claims the product does not make. No page of the site links to them; `verify-site.mjs` checks that.
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

Product specifications, dashboard reviews and release notes are maintained outside this public website repository.

The Host dashboard (`/dashboard/host/` and `/dashboard/host/overview/`) has one stylesheet, `css/host-dashboard.css`, built on the website tokens in `css/platform.css` (ink, muted, line, card, Host blue `#0b63ff`) and Manrope. It loads after `css/host-portal.css` (base, sign-in card and authenticator dialog) and before `css/host-admin.css` (Platform overview). The page has a glass top bar (page title, the product pill at the top centre, the join-organization bell, the language button and the account menu), a glass sidebar (organization card with the Host role, navigation, the My systems list for Host plan holders, Platform for the WIFIGATE operator) and opaque white cards on the Host backdrop. Below 960px the sidebar is a drawer and a tab bar sits at the bottom. Logical CSS properties mirror everything in Hebrew except the Host | Pay | Manager order. Copy is Hebrew-first; ⓘ tooltips replace hint text. The ⓘ bubbles, the product list, the organization list and the account menu are fixed floating panels (`js/popover.js`) placed inside the viewport in both directions; only the script opens an ⓘ (hover, tap or keyboard focus; Escape, leaving or a second tap closes it). On a phone the open drawer makes everything behind it inert. A name keeps its own direction inside a `<bdi>` while its line keeps the page direction and alignment. Hebrew text stops at weight 700 through `--weight-heavy`: Manrope has no Hebrew letters, and heavier system fallbacks draw a serif. The product pill sits at the top centre at every width on the picker, Pay, Manager and Host. Do not reduce permissions to simplify the interface.

The backdrop `assets/img/host-backdrop.svg` comes from `scripts/generate-host-backdrop.mjs`; the picker's `assets/img/dashboard-backdrop.svg` comes from `scripts/generate-dashboard-backdrop.mjs`. Both use the shared helpers in `scripts/lib/network-backdrop.mjs` and are deterministic.

Overview's Admins, Users and Organizations are clickable directory tabs with count badges. A routine window-focus access check preserves the current screen and unfinished input when access is unchanged. Changed roles/MFA states trigger a fresh dashboard load; revoked access still clears the workspace, and failed verification shows a retry state. This is not a replacement for backend authorization.

For UI verification, run `npm run test:dashboard` and `npm run test:platform` (set `WIFIGATE_BROWSER_CHANNEL=msedge` when using Edge). Optional `WIFIGATE_SCREENSHOT_DIR` saves fixture-only visual review captures outside the repository. Rebuild the dashboard bundles and Overview entry document with `npm run build:api` after JavaScript or entry-page changes. `npm run test:dashboard` fails while `js/api/index.js`, `js/host-dashboard.bundle.js`, `js/platform-dashboard.bundle.js` or the Overview copy differ from their sources (`scripts/bundles-current.test.mjs`; the build options live in `scripts/lib/bundles.mjs`).

This repository is the frontend; `C:/wifigate_host` is the authoritative backend. The shared sign-in pages are `/login/` (English) and `/he/login/` (Hebrew, RTL). Language comes from the URL and is not persisted. Google/Apple authentication, redirect fallback, session restoration and TOTP challenges call read-only `GET /api/v1/platform/me`; signing in does not create Host access or a Host profile.

`/dashboard/` always displays the Host | Pay | Manager picker, including when only one product is active. Each tile uses its server state: `active`, `pending`, `no-plan`, `blocked`, `mfa-required`, or `unavailable`. Product outages do not disable other tiles. A platform outage hides the tiles and offers retry while retaining Firebase authentication. Unenrolled administrators can enroll and verify TOTP directly from this picker. Optional authenticator setup is available for verified users.

`/dashboard/host/` decides access from `GET /api/v1/platform/me` alone. `products.host.role` is the Host plan role: `admin` (the WIFIGATE operator) or `user` (a paying customer) holds a plan and sees My systems; `null` is an organization member, who reaches Host without My systems. A `pending` Host state (an invitation and nothing else) opens Host with only the join-organization view, and the picker's Host tile offers Open. Every other state returns to the picker, which explains it and holds authenticator setup. `/dashboard/pay/` remains an access-checked empty workspace. `/dashboard/manager/` renders the Manager workspace; `/pay/` and `/manager/` remain aliases. Manager platform administrators land on customer accounts, paying users on My systems, and organization members on their authorized organization. A platform role alone does not open a customer gate session. The product pill lists all three products and disables the ones that can't open, with an ⓘ that says why. Host organizations and memberships come from the authorized Host APIs; `/api/v1/me/...` routes go through the same portal adapter, and `403 HOST_PLAN_REQUIRED` refuses only that action. `403 SUBSCRIPTION_UNAVAILABLE` (an organization whose service is paused) refuses only that change, on any route. So do `403 OWNER_REQUIRED` (an API key change by an admin) and `403 SLO_OWNER_UNAVAILABLE` (a responsible member who cannot own the service targets). Every 403 on `POST /api/v1/auth/invitations/:id/accept` except `PORTAL_ACCESS_DENIED` stays in the join view, which says why (for example `INVITER_ACCESS_DENIED`: the owner who asked is no longer active).

Relative `next` links support the existing `/dashboard/host/`, `/dashboard/host/overview/`, `/dashboard/pay/` and `/dashboard/manager/` pages, including their query and fragment. External URLs, encoded path separators, traversal and unimplemented nested routes are discarded. A supported link resumes only if the server reports the product active; Overview additionally requires Host administrator authorization and verified TOTP. Nested domain pages such as `/dashboard/pay/transactions/1` remain unavailable until those screens and routes are implemented; sign-in falls back to the picker. Sessions use Firebase tab persistence and end after 30 idle minutes or HTTP401. Access-denial403 clears the current workspace and returns to the picker for fresh states. Recent-authentication errors preserve the action's recovery message; resource-specific rejections remain in their action view, and revoked support approval clears prior diagnostics. Stale organization responses cannot clear a newer workspace. Language, product access, roles and TOTP secrets are never cached in browser storage. The backend remains responsible for authorization on every request.

The Host workspace views are My systems (`?view=my-systems`, Host plan holders, their home), Organization systems (`systems`, the home of an organization member), Calendar, Bookings (`bookings`), Activity (`activity`), Connect (`connect`) and Settings (`settings` with `?tab=organization|team|billing|support|account`), plus the join-organization view behind the bell and Platform (`/dashboard/host/overview/`). Old view ids stay working links (`reservations`, `operations`, `integrations`, `automation`, `api-keys`, `team`, `billing`, `support`, `organization`, `account`, `properties`). Which views exist comes from the Host plan and the selected organization's `workspace.permissions`, never from role names; a view that is never allowed is not shown. Selected views survive refresh and browser history. The join view needs no organization membership. Calendar has one row per active system of the organization, in the organization's time zone (`POST …/reservations/time-zone/resolve` with no property), with week, two-week and month ranges (two weeks on a computer, one week on a phone, an agenda below 480px) and filters by system and booking state. Bookings lists the organization's bookings in Today, Upcoming, Past and Cancelled tabs with a search; a booking made before systems (no `systemId`) shows `—` for its system; one that holds several systems is never edited or linked, but Cancel closes it on the first system it holds. The booking sheet (`+ Booking`, an empty calendar day, or a system card's Create guest link) asks for the system, the guest's name, a phone with a country picker (sent as E.164) and the arrival and departure (15:00 and 12:00), with More details collapsed; Create guest link sends the confirmed booking, issues its access and reveals its link (three requests, each with its own Idempotency-Key) and the sheet becomes the link card (Copy, WhatsApp to the guest's number, QR). Save without link keeps a draft. A time that happens twice on a clock-change night asks which one. Viewers read; staff, admins and owners book. My systems lists the plan holder's own systems (added from the WIFIGATE app) with their organization badge or "Not linked", also as a compact list in the sidebar; from there a system is linked to an organization where the person is an owner or admin, unlinked, or removed while it is not linked (`POST /api/v1/me/systems/:id/link|unlink|remove` with an Idempotency-Key and the recent sign-in retry). Organization systems lists the selected organization's active systems and where each came from; owners and admins (`systems:write`) change an icon (31 SVG icons) or remove one; whoever books (staff and up) gets Create guest link on each card; viewers only see them. While an organization's service is paused, Create guest link, Change icon and its place in the Link dialog are disabled with an ⓘ; Remove stays open, as in the backend, so the organization can still free its gates. An unlink or removal that upcoming bookings still use is refused with their count and a way to that organization's Bookings (for an organization the person no longer belongs to, who can move them instead); the red button then leaves the dialog. If My systems cannot be read, the screen says so in one sentence with one action and still shows the examples. Systems are added and renamed only in the WIFIGATE app; the website has no key entry, rotation or transfer. Three example systems (`js/host-example-systems.js`) are shown to everyone who reaches Host, in My systems for plan holders and in an Examples group on Organization systems for everyone else; they cannot be removed and never reach the API, a calendar or a booking, and linking one only changes its own badge in this browser (`localStorage`, keyed by a SHA-256 of the uid). Try it (`js/host-try-it.js`) shows how a guest link is made by hand, from a booking system or after a payment, entirely in the browser with no request; requests for a developer carry placeholders, never keys. Its link is a demo link (`https://wifigate.io/wifigate-api/?ep=v1.demo_…` with only the example and the stay), for which the invitation page shows a preview and never opens the app. Screens load on demand with isolated retries; an Operations outage cannot remove Calendar, and Billing does not depend on Operations. Organization/session changes discard cached references and late responses. The backend remains authoritative for live membership, role, MFA, service entitlement, version conflicts, overlap prevention and retry safety. Billing statements are internal drafts, not payments or issued tax invoices.

Booking sheets keep their heading and buttons visible while the fields, More details and guest links scroll. The same form validation, current-version checks and idempotency apply to the footer's associated submit button. Browser regressions verify both scroll boundaries in English and Hebrew, including 320px screens. Calendar accessible labels, booking lists and team invitation expiry use the selected interface language and the organization's time zone or UTC; user-entered names and API enum values remain intact.

Billing statuses, organization settings, support approvals and operational access/key expiry follow the selected interface language. Operational timestamps use UTC independently of the browser timezone; booking dates use the organization's time zone. Missing or corrupt dates display an unavailable state. Reloading a subscription discards the previous revision immediately, and a failed or abandoned reload cannot enable a stale change. Billing failures distinguish missing verified history, an open month, version conflicts and authenticator requirements instead of reporting every failure as a generic error.

Host administrator sign-in dates also follow the selected interface language and explicitly identify UTC. Access-change confirmation buttons use complete translated phrases in Hebrew; opening and canceling these reviews does not change access.

The private backend project maintains the authentication contract and setup requirements. The backend implements authorization/MFA fields, access lifecycle, and tenant endpoints under `/api/v1/organizations`; its README is the complete endpoint registry. Missing authorization fields fail closed.

### V1 administrator Overview

Verified Host admins can enter Overview from the sidebar or `/dashboard/host/overview/?tab=admins|users|organizations`. It provides counts, paginated searchable directories, add admin/user with optional organization invitation, per-product membership details, owner-email organization creation and member invitations/removal. Role badges use fixed colors and keyboard-accessible explanations. Self access and the last active administrator are protected; the server also protects the last organization owner.

New organizations remain pending until the designated owner accepts with an authenticator. Recipients can start enrollment from their invitation, then accept after fresh verification. Expired initial owner invitations can be renewed. These are dashboard invitations; no email is sent automatically.

If an owner's team invitation creation or cancellation receives `RECENT_TOTP_REQUIRED`, the interface requests genuine provider/TOTP reauthentication and retries the same immutable request with its original idempotency key. Input remains locked during authentication; a changed organization or closed view prevents the deferred retry. Calendar and list entries for erased guest details display a localized privacy placeholder without translating user-entered guest names.

Remove organization archives it and retains history. The confirmation shows affected records and gates, requires the exact name and fresh MFA, and refuses archival while any of its systems still holds a gate (remove those systems first). Every mutation carries an idempotency key and the current version where required; stale views clear on account/access changes.

A missing `/api/v1/platform/me` (404), an authorization failure or an outage keeps every dashboard closed; there is no other access endpoint. Full Overview functionality requires the matching backend's `/api/v1/admin/overview`, `/people`, `/organizations` and organization archive endpoints. Deploy the backend/indexes before this rebuilt frontend; the backend README and OpenAPI define the complete contracts.

`npm run test:api` covers the access contract and strict paths. `npm run test:platform` covers actual dashboard entry and admin desktop/mobile confirmation/MFA flows with isolated fixtures; the backend emulator suite verifies persistence, ownership and retained history. Real production providers and hardware still require release acceptance.

### Calendar workspace

The reference image belongs to the specification; the dashboard renders interactive calendar elements instead of an image. Tenant management uses the authenticated API adapter in `api/host/portal-request.ts`; no product data is read directly from Firestore. The Host emulator suite exercises the actual portal against Firestore for the organization, systems, bookings and team at desktop and mobile widths.

### Configuration and build

Public Firebase Web configuration is in js/firebase-config.js (eats-wifigate). The backend must verify tokens for that same project. Enable Google and Apple in Firebase, authorize the site domains, and configure Apple's Web Services ID and Firebase handler return URL. Apple private keys belong in Firebase/server configuration, never in this repository's browser code.

TOTP requires Firebase Authentication with Identity Platform and project-level TOTP activation. The UI generates QR codes locally with a vendored MIT QR encoder; no setup secret goes to a QR service, application API, browser storage, or logs. There is no public role assignment or MFA recovery endpoint in the frontend.

Axios endpoints live in api/auth/ and share api/api.ts. After editing portal source, run npm run build:api to regenerate js/api/index.js, js/host-dashboard.bundle.js (/dashboard/host/) and js/platform-dashboard.bundle.js (the /dashboard/ picker, /dashboard/pay/ and /dashboard/manager/). Each page loads one versioned bundle to avoid stale module mixtures; bump its ?v= when it changes; public Host configuration remains an external runtime module for isolated emulator overrides. npm run dev performs that build and serves the normal site on port 8000; it is not needed for each edit.

The canonical production API is `https://api.wifigate.io`. All local API clients use `http://127.0.0.1:8001` when the site runs on port 8000; staging 8100 uses API 8101. Configuration lives in `js/host-api-config.js`. CORS must allow the exact frontend origin and the required GET/PUT/POST/DELETE methods, with Authorization, Content-Type and Idempotency-Key headers. The application does not send a Cache-Control request header.

### Manager workspace administration

Manager displays the signed-in email and verified Manager role(s) in its account
card. Platform Manager admins have an Overview and separate customer, platform
admin, organization administrator and organization directories. Organizations are
shown as columns with their owner, administrator appointments and active linked
system count. Mutations use server authorization, recent authentication and
confirmation for revocation/archive; archived organizations retain history and
other product entitlements. The directory uses bounded pages.

### Manager deployment configuration

All authenticated website API requests now attach App Check through the shared
`authenticatedRequest` boundary, including product identity, Host administration,
organization operations, CSV exports, account deletion and Manager. Callers
cannot substitute the integrity header. An absent configuration or malformed
token fails before an API request is sent. The backend independently enforces
integrity as well as identity, permissions and browser MFA. Publish this client
before deploying the corresponding Host server enforcement.

Manager requests use the dedicated API in `js/manager-api-config.js`; Host and
shared account identity retain `js/host-api-config.js`. The currently deployed
Manager API uses the isolated `wifigate-manager-staging` database documented in
the backend's `docs/manager-staging.md`. Pointing the website at this deployment
does not migrate Host data or constitute production acceptance of Manager.
Local ports 8000 and 8100 retain their local API overrides.

The site's Firebase Web App must have a registered reCAPTCHA Enterprise App
Check provider with an allowed website domain, and its public key must be set
as `firebaseConfig.appCheckSiteKey`. An empty key fails closed. Manager also
requires the matching UID-bound access record in its own metadata database;
the main product picker uses the primary database. A role in just one database
does not provision the other. Browser TOTP remains required in both services.

### Checks

V10 pins Firebase CLI 15.33.0 and scopes its Chokidar dependency to 4.0.3 and complete Pub/Sub dependency to 6.2.0. This removes the previously reported development watcher/OpenTelemetry advisory paths. Chokidar 4 supports explicit files/directories rather than glob expansion; this site's isolated Auth staging workflow is verified. These tools are not shipped in the browser bundles. Full `npm audit --audit-level=moderate` now gates CI; recheck at release. The compatibility decision is in backend `docs/decisions/0006-v10-operational-evidence.md`.

- npm run test:api: TypeScript build and access/API unit tests.
- npm run test:platform: isolated browser checks for bilingual login, product states, MFA, redirects, idle expiry and401/403 cleanup; no cloud credentials or production data.
- npm run test:staging: Auth Emulator token/API tests, mock Google/Apple browser flows, and isolated browser fixtures for TOTP enrollment/challenges/approval.
- npm run test:health: isolated desktop/mobile Service health, freshness/error states, role restrictions and late-response fencing.
- node scripts/host-portal-browser.test.mjs: browser fixtures (Host sign-in, the Platform page, owner team invitations) against the site on port 8100, or on WIFIGATE_SITE_ORIGIN; no emulator required. npm run test:staging runs it last; npm run test:dashboard runs it through scripts/host-portal-fixtures.test.mjs, which starts the static site on a free port.

Staging is entirely local. Approved user fixtures: owner@grandplaza.test and member@grandplaza.test. admin@wifigate.test is an admin without TOTP and must remain in enrollment. pending@wifigate.test is pending; other emails are denied. These names are fixtures, not a production allowlist.

The Auth Emulator does not provide a production TOTP acceptance test. The fixture suite exercises SDK call ordering, invalid codes, admin enrollment and verified-session gates, optional user enrollment, revoked access, error states, logout, and responsive My systems workspace rendering. Real Google/Apple configuration, production backend authorization, real authenticator enrollment, and real organization onboarding require production acceptance before release.
# Host automation controls

Connect → Automatic guest links holds one policy per organization (`GET/PUT …/automation/policy`): on or off, minutes before arrival and after leaving, and whether the link is only made or also sent through the booking system (its delivery ids sit under For your developer). The policy loads with the screen, so a save carries its current version. Staff can view bounded job status and audit-reason retries for failed/paused jobs. The page displays delivery receipt identifiers and the offline expiry warning, without listing private links or guest details in operational rows. All actions use the live Host authorization and idempotency contracts.

Sensitive API-key, support-approval and billing writes resume after genuine provider/authenticator reauthentication when the server reports an expired recent-identity window. The retry keeps the reviewed request body and idempotency key, refreshes the Firebase token and stops if the workspace changes. Permission denials never trigger automatic retries; canceled verification and repeated stale-identity errors return control to the user. `npm run test:dashboard` exercises these forms in both languages, including edits and double clicks during verification and abandoned organizations.

Calendar reservation cards span local calendar dates. Same-day turnover cards occupy separate lanes; midnight departure remains exclusive. On phones the timeline scrolls without expanding the page. `npm run test:dashboard` checks this workspace with isolated data and a headless Chrome browser; `npm run test:api` covers clipping, overlapping visual spans and DST boundaries. The document image remains a design reference. The dashboard contains no static calendar placeholder.

## Platform management

The main dashboard shows only a floating Platform management shortcut for a verified WIFIGATE admin with current TOTP: bottom right in Hebrew, bottom left in English. It opens the separate `/dashboard/platform/` page and preserves language; the personal profile makes no directory requests. The dedicated page has a dashboard return link, summary counts, product navigation and collapsed keyboard-accessible account cards with monthly estimates. It separates WIFIGATE Admins and Users, deduplicates provisioned emails, lists product states, Host pricing tiers, billable physical gates and monthly estimates. The For Business links lead to Host, Pay and Manager. Host and Manager retain their existing scoped administration actions and expose a lazily loaded plans/costs section in their overview; Pay administrators receive its scoped directory.

`GET /api/v1/platform/directory` validates all authority on the backend, pages 10 accounts at a time, and supports product/role filters. A product admin cannot use a product view to read other products. Counts include provisioned pending/blocked records and are not a count of paying subscribers. Financials reuse owned-inventory estimates before tax; missing data is shown as unavailable and Pay does not invent a payment or revenue feed. No payment is collected by these views.

Verification: `node --test scripts/platform-admin-directory-browser.test.mjs` covers Hebrew phone layout, hidden access for non-admin/unverified sessions, counts, pagination, filters and Pay scoping. Optional `WIFIGATE_ADMIN_SCREENSHOT` saves a fixture screenshot (sample data, not production users).
