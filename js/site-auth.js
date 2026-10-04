import { AuthErrors, AuthProviders } from "./host-constants.js";
import { firebaseConfig, isLocalStaging } from "./firebase-config.js";
let auth;
let authApi;
let initialization;
async function ready() {
  if (!initialization) {
    initialization = (async () => {
      const requiredConfigFields = ["apiKey", "authDomain", "projectId", "appId"];
      const hasFirebaseConfig = requiredConfigFields.every((key) => firebaseConfig[key]);
      if (!hasFirebaseConfig) {
        throw new Error(AuthErrors.UNCONFIGURED);
      }
      const [{ initializeApp }, api] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js")
      ]);
      authApi = api;
      auth = api.getAuth(initializeApp(firebaseConfig));
      if (isLocalStaging) {
        api.connectAuthEmulator(auth, "http://127.0.0.1:9099", {
          disableWarnings: true
        });
      }
      await api.setPersistence(auth, api.browserSessionPersistence);
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
async function authenticate(action, onChallenge) {
  try {
    return await action();
  } catch (error) {
    if (error.code !== AuthErrors.MFA_REQUIRED) {
      throw error;
    }
    return onChallenge(authApi.getMultiFactorResolver(auth, error));
  }
}
export async function resolveTotp(resolver, factorUid, code) {
  return resolver.resolveSignIn(
    authApi.TotpMultiFactorGenerator.assertionForSignIn(factorUid, code)
  );
}
export async function signIn(providerName, onChallenge) {
  await ready();
  return authenticate(
    () => authApi.signInWithPopup(auth, providerFor(providerName)),
    onChallenge
  );
}
export async function completeAuthCallback(onChallenge) {
  await ready();
  return authenticate(() => authApi.getRedirectResult(auth), onChallenge);
}
export async function signInRedirect(providerName) {
  await ready();
  return authApi.signInWithRedirect(auth, providerFor(providerName));
}
export async function reauthenticate(user, onChallenge) {
  const token = await user.getIdTokenResult();
  const id = token.claims.firebase?.sign_in_provider;
  const name = id === AuthProviders.GOOGLE_ID ? AuthProviders.GOOGLE : id === AuthProviders.APPLE_ID ? AuthProviders.APPLE : null;
  return authenticate(
    () => authApi.reauthenticateWithPopup(user, providerFor(name)),
    onChallenge
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
  await authApi.multiFactor(user).enroll(assertion, "WIFIGATE Host authenticator");
  await user.getIdToken(true);
}
export async function signOut() {
  await ready();
  return authApi.signOut(auth);
}
