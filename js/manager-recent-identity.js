// The UI guard complements, and never replaces, server-side identity checks.
// Destructive reset always requires a new provider + authenticator sign-in.
export async function verifyManagerRecentIdentity({ user, reauthenticate, isCurrent }, {
  maxAgeSeconds = 86400, force = false, requireTotp = false,
} = {}) {
  const assertCurrent = () => {
    if (!isCurrent()) throw new Error("CANCELLED");
  };
  const recent = token => {
    const at = Number(token.claims.auth_time);
    const age = Date.now() / 1000 - at;
    return Number.isFinite(at) && at > 0 && age >= 0 && age <= maxAgeSeconds;
  };
  const totp = token => token.claims.firebase?.sign_in_second_factor === "totp" &&
    typeof token.claims.firebase.second_factor_identifier === "string" &&
    token.claims.firebase.second_factor_identifier.length > 0;
  assertCurrent();
  let token = await user.getIdTokenResult();
  assertCurrent();
  if (force || !recent(token) || (requireTotp && !totp(token))) {
    await reauthenticate();
    assertCurrent();
    token = await user.getIdTokenResult(true);
    assertCurrent();
  }
  if (!recent(token)) throw new Error("RECENT_REAUTH_REQUIRED");
  if (requireTotp && !totp(token)) throw new Error("TOTP_REQUIRED");
}
