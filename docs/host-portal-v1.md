# Frontend V1 integration contract

Frontend contract aligned with the shared-login section of WIFIGATE_HOST.html, 6 October 2026. Local implementation and browser checks do not activate Firebase Identity Platform, TOTP or production deployment.

## Shared product entry

`/login/` is neutral English WIFIGATE sign-in; `/he/login/` is Hebrew RTL. Neither persists a language preference. Shared authentication calls `GET /api/v1/platform/me`, returning `{ user, mfa: { enrolled, verified }, products: { host, pay, manager } }`. Each product has a server-provided `state` and may include an organization count. Supported states are `active`, `pending`, `no-plan`, `blocked`, `mfa-required` and `unavailable`.

`/dashboard/` is the product picker. The visual order remains Host, Pay, Manager at desktop/mobile sizes and in both directions. Active products link to `/dashboard/host/`, `/dashboard/pay/` and `/dashboard/manager/`. Pay and Manager currently expose guarded empty workspaces, not payment or remote administration functions. An inactive product cannot be opened through a direct route. Host profile synchronization occurs only after entering the authorized Host workspace.

The `next` parameter accepts the implemented `/dashboard/host/`, `/dashboard/pay/` and `/dashboard/manager/` pages, with their query and fragment preserved. Encoded path separators, traversal, external origins, malformed paths and unimplemented nested routes are rejected. A permitted path resumes only when its product is active; other return paths fall back to the picker. Arbitrary nested product screens in the target specification remain future work. The interface checks access on entry and focus; API401 signs out and access-denial403 clears product data and returns to the picker. Recent-authentication failures retain their recovery controls. Resource-specific rejections remain in their action view; expired or revoked support approval clears prior diagnostics without revoking unrelated portal access. A late organization-scoped denial is ignored after switching organizations. Firebase sessions remain per-tab with a 30-minute inactivity timeout. TOTP enrollment/verification is reachable from the shared picker without an admin API call.

## Identity and authorization

Every application API request uses Authorization: Bearer <Firebase ID token>. The frontend does not send provider OAuth tokens, trust client-supplied identity/roles, access Firestore, or contain an Admin SDK or service account. Firebase SDK session handling is separate from application API calls.

PUT /api/v1/users/me keeps its existing empty JSON body and returns { user }. The response creates/synchronizes the profile, not portal access.

GET /api/v1/users/me must return:

```json
{
  "user": {
    "uid": "firebase-uid",
    "email": "approved@example.com",
    "displayName": "Approved User",
    "emailVerified": true
  },
  "role": "admin",
  "access": { "state": "active" },
  "mfa": { "required": true, "enrolled": true, "verified": true }
}
```

- role: admin, user, or null. No client/organization roles in V1.
- access.state: active, pending, or denied. A pending/denied identity may have role null.
- user.emailVerified: derived from Firebase, never the browser request body.
- mfa.required: server policy; the frontend always requires MFA for admins, even if this flag is false.
- mfa.enrolled: an enrolled **TOTP** factor, verified by the server from Firebase user metadata.
- mfa.verified: the current token/session actually completed a TOTP challenge, not merely enrollment. Validate the Firebase second-factor claim. The backend must enforce this on admin mutations.

The actual Host returns 403 without a profile for unapproved/blocked users, and returns the trusted state above for approved admins who need enrollment. The UI renders denial on 403. Pending remains supported for compatible future servers. 401 means invalid/expired session. Missing or malformed authorization fields show an error and never expose the portal. All application responses use Cache-Control: no-store.

## Manage user or administrator access

POST /api/v1/admin/portal-access:

```http
Authorization: Bearer <Firebase ID token>
Content-Type: application/json
Idempotency-Key: <UUID per logical approval; retained on retry>

{"email":"new-user@example.com","status":"active","role":"user"}
```

The frontend sends normalized email, active/blocked status and optional user/admin role, never UID or MFA assertions. Omitting role during block/unblock preserves the existing role. DELETE on the same endpoint sends only {email} and removes portal access, retaining the Auth account and profile. Before deleting access the UI reauthenticates with the original provider and completes TOTP, retaining the logical idempotency key. The backend verifies active admin access, recent authentication, current verified TOTP, validation, idempotency and audit. It rejects own-access changes and blocking/deleting/demoting the last active administrator, inside the mutation transaction. New administrators must enroll TOTP. First-admin bootstrap stays out of band.

For errors, use { "error": { "code": "MFA_REQUIRED", "message": "..." } }. The UI shows safe local messages and preserves the idempotency key for an uncertain retry. It refreshes authorization before submitting and hides admin controls if access has changed. Backend enforcement remains necessary on the POST itself.

## Firebase and deployment

Frontend project: eats-wifigate. Confirm the backend project matches. Keep production/staging projects separate. Confirm the deployed backend HTTPS origin; the frontend currently retains https://api.wifigate.io and uses 127.0.0.1:8001 on the local development site.

Configure Google/Apple providers and authorized domains. Apple Hide My Email requires approval of the relay email or verified account linking; the frontend does not silently substitute an address.

Enable Identity Platform and TOTP after billing review. Browser enrollment reauthenticates with the original provider, creates the TOTP secret through Firebase, displays a locally generated QR/manual key, and confirms the authenticator code through Firebase. Setup secrets stay in transient memory and are cleared after enrollment, cancellation, logout, and navigation.

Enrollment alone may not mark the session MFA-verified. If the backend reports enrolled=true, verified=false for an admin, the UI prompts reauthentication and resolves the Firebase TOTP challenge before enabling the portal/admin form. Regular users can skip enrollment and still enter an approved portal. Users with enrolled MFA are challenged at later provider sign-ins.

Recovery instructions direct users to a platform owner. Actual recovery must be enforced/audited server-side; no shared recovery code, factor reset, or downgrade is implemented in the browser.

## Remaining release dependencies

- Backend implemented; machine-readable API contract and recovery/release procedures are in the Host repository.
- Firebase provider/TOTP configuration and real integration verification.
- The supplied 3840×2160 Calendar reference image is configured at docs/assets/wifigate-host-calendar-reference.png and checked on desktop/mobile browsers.
- Production origin, CORS, and hosting headers. GitHub Pages does not provide application API enforcement; the API must do it.

Verification: npm run test:api builds/typechecks the request contracts; npm run test:staging checks emulator Google/Apple popups against the demonstration API and browser MFA fixtures. The Host npm run test:emulators additionally runs this actual website against real Host HTTP enforcement, real Auth emulator tokens and Firestore. Browser SDK adapters are substituted in that cross-repository test; application responses are real. Real authenticator verification and real provider redirects need separate staging evidence. The public API origin module stays external to the client bundle so deployment configuration does not require rebuilding the client.

QR encoder: qrcode-generator js2.0.4, vendored from upstream commit 83b7e8fe3fddd3b0368dbafd6ce56995bd25e3c8 (js/dist/qrcode.js), with MIT license. Only an ESM export was appended; no package was installed.
