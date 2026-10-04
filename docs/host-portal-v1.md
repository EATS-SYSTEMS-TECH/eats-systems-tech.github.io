# Frontend V1 integration contract

This is the frontend's proposed contract, pending agreement with the backend. No backend files or Firebase project settings were changed. Source specification: WIFIGATE_HOST.html, reviewed 30 September 2026.

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

Return access/MFA state even for pending/denied users and admins who need enrollment, so the UI can route them correctly. 401 means invalid/expired session. A 403 may also represent denied access; PORTAL_ACCESS_PENDING selects pending copy. Missing or malformed authorization fields show an error and never expose the portal. All responses need Cache-Control: no-store.

## Approve a regular user's email

POST /api/v1/admin/portal-access:

```http
Authorization: Bearer <Firebase ID token>
Content-Type: application/json
Idempotency-Key: <UUID per logical approval; retained on retry>

{"email":"new-user@example.com"}
```

The frontend sends a normalized email only, no UID, admin role, or MFA assertions. A 2xx response means the email approval was committed. The server must verify active admin access, a TOTP-verified session, email validation, idempotency, and audit. It must not offer self-promotion or accept role assignment from this body. First-admin bootstrap stays out of band.

For errors, use { "error": { "code": "MFA_REQUIRED", "message": "..." } }. The UI shows safe local messages and preserves the idempotency key for an uncertain retry. It refreshes authorization before submitting and hides admin controls if access has changed. Backend enforcement remains necessary on the POST itself.

## Firebase and deployment

Frontend project: eats-wifigate. Confirm the backend project matches. Keep production/staging projects separate. Confirm the deployed backend HTTPS origin; the frontend currently retains https://api.wifigate.io and uses 127.0.0.1:8001 on the local development site.

Configure Google/Apple providers and authorized domains. Apple Hide My Email requires approval of the relay email or verified account linking; the frontend does not silently substitute an address.

Enable Identity Platform and TOTP after billing review. Browser enrollment reauthenticates with the original provider, creates the TOTP secret through Firebase, displays a locally generated QR/manual key, and confirms the authenticator code through Firebase. Setup secrets stay in transient memory and are cleared after enrollment, cancellation, logout, and navigation.

Enrollment alone may not mark the session MFA-verified. If the backend reports enrolled=true, verified=false for an admin, the UI prompts reauthentication and resolves the Firebase TOTP challenge before enabling the portal/admin form. Regular users can skip enrollment and still enter an approved portal. Users with enrolled MFA are challenged at later provider sign-ins.

Recovery instructions direct users to a platform owner. Actual recovery must be enforced/audited server-side; no shared recovery code, factor reset, or downgrade is implemented in the browser.

## Remaining release dependencies

- Agreement on the response/body above and backend implementation.
- Firebase provider/TOTP configuration and real integration verification.
- The actual Calendar reference image; the supplied HTML does not embed or link it. Set its path in js/host-portal-config.js once supplied.
- Production origin, CORS, and hosting headers. GitHub Pages does not provide application API enforcement; the API must do it.

QR encoder: qrcode-generator js2.0.4, vendored from upstream commit 83b7e8fe3fddd3b0368dbafd6ce56995bd25e3c8 (js/dist/qrcode.js), with MIT license. Only an ESM export was appended; no package was installed.
