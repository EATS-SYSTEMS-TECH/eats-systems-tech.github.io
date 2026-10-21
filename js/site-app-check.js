import { firebaseConfig, isLocalStaging } from "./firebase-config.js";

let initialization;
/** App Check is separate from user authentication; an absent site key fails closed. */
export async function siteIntegrityHeaders() {
  if (isLocalStaging && firebaseConfig.projectId.startsWith("demo-")) {
    return { "X-Firebase-AppCheck": "isolated-manager-staging" };
  }
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
  const { appCheck, getToken } = await initialization;
  const { token } = await getToken(appCheck, false);
  return { "X-Firebase-AppCheck": token };
}
