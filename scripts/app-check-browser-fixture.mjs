// App Check SDK stand-in for isolated browser tests; never loaded by the site.
export async function installAppCheckFixture(context, token = "browser-app-check") {
  await context.route("https://www.gstatic.com/firebasejs/**/firebase-app.js", (route) => route.fulfill({
    contentType: "application/javascript",
    body: "export const initializeApp = value => value; export const getApp = () => ({});",
  }));
  await context.route("https://www.gstatic.com/firebasejs/**/firebase-app-check.js", (route) => route.fulfill({
    contentType: "application/javascript",
    body: `export class ReCaptchaEnterpriseProvider {}
      export const initializeAppCheck = () => ({});
      export const getToken = async () => ({token:${JSON.stringify(token)}});`,
  }));
}
