import { AuthErrors, AuthProviders } from "./host-constants.js";
import { firebaseConfig, isLocalStaging } from "./firebase-config.js";
import { initializeSiteAppCheck } from "./site-app-check.js";
let auth;
let authApi;
let initialization;
// Where a sign-in is kept ("Remember me on this device" on /login/ and
// /reservations/, cookie policy section 3): by default only for this tab
// (session storage), until sign-out or closing the tab; when the person asks
// to be remembered, in local storage until sign-out or clearing site data. The
// choice is made at sign-in. A page load never moves a signed-in account
// between the two: Auth starts with session storage first and without
// setPersistence, and Firebase restores the account from whichever storage
// holds it (an account saved in local storage before this choice existed stays
// there until sign-out).
//
// A full-page (redirect) sign-in finishes while Auth starts on the page it
// returns to, and Firebase saves it to the storage that already holds an
// account there, or session storage. The choice to be remembered crosses the
// redirect in this tab's session storage under REMEMBER_KEY;
// completeAuthCallback reads and removes it and moves the new account to the
// chosen storage. forgetRedirectChoice removes it when a redirect is abandoned.
const REMEMBER_KEY = "wifigate-auth-remember";
export function forgetRedirectChoice() {
  try { sessionStorage.removeItem(REMEMBER_KEY); } catch { /* Nothing stored. */ }
}
function takeRedirectChoice() {
  try {
    const remember = sessionStorage.getItem(REMEMBER_KEY) === "1";
    sessionStorage.removeItem(REMEMBER_KEY);
    return remember;
  } catch {
    return false;
  }
}
function persistenceFor(remember) {
  return remember ? authApi.browserLocalPersistence : authApi.browserSessionPersistence;
}
async function ready() {
  if (!initialization) {
    initialization = (async () => {
      const requiredConfigFields = ["apiKey", "authDomain", "projectId", "appId"];
      const hasFirebaseConfig = requiredConfigFields.every((key) => firebaseConfig[key]);
      if (!hasFirebaseConfig) {
        throw new Error(AuthErrors.UNCONFIGURED);
      }
      const [{ initializeApp, getApp, getApps }, api] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js")
      ]);
      // A retry after a failed App Check start reuses the app created before it.
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      // App Check before Auth, so every Authentication request is attested.
      await initializeSiteAppCheck();
      authApi = api;
      try {
        auth = api.initializeAuth(app, {
          persistence: [
            api.browserSessionPersistence,
            api.browserLocalPersistence,
            api.indexedDBLocalPersistence
          ],
          popupRedirectResolver: api.browserPopupRedirectResolver
        });
      } catch (error) {
        // Another copy of this module (a versioned URL or a bundle) on the
        // same page started Auth first; share it.
        if (error?.code !== "auth/already-initialized") throw error;
        auth = api.getAuth(app);
      }
      if (isLocalStaging) {
        api.connectAuthEmulator(auth, "http://127.0.0.1:9099", {
          disableWarnings: true
        });
      }
    })().catch((error) => {
      initialization = undefined;
      throw error;
    });
  }
  await initialization;
}
export async function initializeSiteAuth(onUserChanged) {
  await ready();
  return authApi.onAuthStateChanged(auth, onUserChanged);
}
function providerFor(name) {
  const provider = name === AuthProviders.GOOGLE ? new authApi.GoogleAuthProvider() : name === AuthProviders.APPLE ? new authApi.OAuthProvider(AuthProviders.APPLE_ID) : null;
  if (!provider) {
    throw new Error(AuthErrors.INVALID_PROVIDER);
  }
  if (name === AuthProviders.APPLE) {
    provider.addScope("email");
    provider.addScope("name");
  }
  if (name === AuthProviders.GOOGLE) {
    provider.setCustomParameters({ prompt: "select_account" });
  }
  return provider;
}
async function authenticate(action, onChallenge, restartable = false) {
  let restarts = 0;
  for (;;) {
    try {
      return await action();
    } catch (error) {
      if (error.code !== AuthErrors.MFA_REQUIRED) throw error;
      try {
        return await onChallenge(authApi.getMultiFactorResolver(auth, error));
      } catch (challengeError) {
        // Only the user's explicit Restart button opens a new provider flow.
        // Redirect callbacks cannot be replayed, and cancellation never retries.
        if (!restartable || challengeError.code !== "mfa-restart-required" || restarts >= 2) throw challengeError;
        restarts++;
      }
    }
  }
}
export async function resolveTotp(resolver, factorUid, code) {
  // A cached/versioned sign-in entry point may use a different module instance
  // from the challenge dialog. Initialize this instance before using the SDK.
  await ready();
  return resolver.resolveSignIn(
    authApi.TotpMultiFactorGenerator.assertionForSignIn(factorUid, code)
  );
}
// The storage is chosen before the provider window opens, so the account, and
// a second-factor sign-in (resolveTotp) that completes it, are kept there.
// Reauthentication keeps the storage the account is already in.
export async function signIn(providerName, onChallenge, { remember = false } = {}) {
  await ready();
  await authApi.setPersistence(auth, persistenceFor(remember));
  return authenticate(
    () => authApi.signInWithPopup(auth, providerFor(providerName)),
    onChallenge, true
  );
}
export async function completeAuthCallback(onChallenge) {
  await ready();
  const remember = takeRedirectChoice();
  const credential = await authenticate(() => authApi.getRedirectResult(auth), onChallenge);
  // Only a redirect sign-in returns a credential (a second-factor one through
  // onChallenge too): keep it in the chosen storage, whatever storage already
  // held an account when Auth started.
  if (credential?.user) await authApi.setPersistence(auth, persistenceFor(remember));
  return credential;
}
export async function signInRedirect(providerName, { remember = false } = {}) {
  await ready();
  try {
    if (remember) sessionStorage.setItem(REMEMBER_KEY, "1");
    else sessionStorage.removeItem(REMEMBER_KEY);
  } catch {
    // Without session storage, Auth has only local storage left to use.
  }
  try {
    return await authApi.signInWithRedirect(auth, providerFor(providerName));
  } catch (error) {
    forgetRedirectChoice();
    throw error;
  }
}
export async function reauthenticate(user, onChallenge) {
  const token = await user.getIdTokenResult();
  const id = token.claims.firebase?.sign_in_provider;
  const name = id === AuthProviders.GOOGLE_ID ? AuthProviders.GOOGLE : id === AuthProviders.APPLE_ID ? AuthProviders.APPLE : null;
  return authenticate(
    () => authApi.reauthenticateWithPopup(user, providerFor(name)),
    onChallenge, true
  );
}
export async function beginTotpEnrollment(user) {
  if (!user.emailVerified) {
    throw new Error(AuthErrors.UNVERIFIED_EMAIL);
  }
  return authApi.TotpMultiFactorGenerator.generateSecret(
    await authApi.multiFactor(user).getSession()
  );
}
export async function finishTotpEnrollment(user, secret, code) {
  const assertion = authApi.TotpMultiFactorGenerator.assertionForEnrollment(
    secret,
    code
  );
  await authApi.multiFactor(user).enroll(assertion, "WIFIGATE authenticator");
  await user.getIdToken(true);
}
export async function signOut() {
  await ready();
  return authApi.signOut(auth);
}
