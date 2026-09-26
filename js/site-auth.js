import { firebaseConfig, isLocalStaging } from "./firebase-config.js";

let auth;
let authApi;

export async function initializeSiteAuth(onUserChanged) {
  if (!["apiKey", "authDomain", "projectId", "appId"].every((key) => firebaseConfig[key])) {
    throw new Error("site-auth-unconfigured");
  }
  if (!auth) {
    const [{ initializeApp }, api] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js")
    ]);
    authApi = api;
    auth = api.getAuth(initializeApp(firebaseConfig));
    if (isLocalStaging) api.connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  return authApi.onAuthStateChanged(auth, onUserChanged);
}

export async function signIn(providerName) {
  if (!auth) throw new Error("site-auth-unconfigured");
  const provider = providerName === "google"
    ? new authApi.GoogleAuthProvider()
    : providerName === "apple"
      ? new authApi.OAuthProvider("apple.com")
      : null;
  if (!provider) throw new Error("site-auth-unknown-provider");
  if (providerName === "apple") {
    provider.addScope("email");
    provider.addScope("name");
  }
  return authApi.signInWithPopup(auth, provider);
}

export async function signOut() {
  if (!auth) throw new Error("site-auth-unconfigured");
  return authApi.signOut(auth);
}
