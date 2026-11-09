import { firebaseConfig, isLocalStaging } from "./firebase-config.js";

let initialization;
const isolatedStaging = () => isLocalStaging && firebaseConfig.projectId.startsWith("demo-");

/**
 * Activates App Check on the default Firebase app. Site auth calls this right
 * after initializeApp so Firebase Authentication requests carry an App Check
 * token too (Authentication App Check enforcement, 2026-11-09).
 */
export async function initializeSiteAppCheck() {
  if (isolatedStaging()) return null;
  if (!firebaseConfig.appCheckSiteKey) throw Object.assign(new Error("App integrity is not configured"), { code: "APP_CHECK_UNCONFIGURED" });
  initialization ??= (async () => {
    const [{ getApp }, api] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app-check.js"),
    ]);
    const appCheck = api.initializeAppCheck(getApp(), {
      provider: new api.ReCaptchaEnterpriseProvider(firebaseConfig.appCheckSiteKey), isTokenAutoRefreshEnabled: true,
    });
    return { appCheck, getToken: api.getToken };
  })().catch((error) => { initialization = undefined; throw error; });
  return initialization;
}

/** App Check is separate from user authentication; an absent site key fails closed. */
export async function siteIntegrityHeaders() {
  if (isolatedStaging()) {
    return { "X-Firebase-AppCheck": "isolated-manager-staging" };
  }
  const { appCheck, getToken } = await initializeSiteAppCheck();
  const { token } = await getToken(appCheck, false);
  if (typeof token !== "string" || !token.length || token.length > 8192 || /\s/.test(token)) {
    throw Object.assign(new Error("App integrity verification failed"), { code: "APP_CHECK_REQUIRED" });
  }
  return { "X-Firebase-AppCheck": token };
}
