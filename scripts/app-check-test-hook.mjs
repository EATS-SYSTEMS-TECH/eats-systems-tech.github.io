import { registerHooks } from "node:module";

// Only isolated Node API tests import this hook. Production modules still
// execute the real App Check code; no runtime switch accepts test tokens.
registerHooks({
  resolve(specifier, context, next) {
    if (/^https:\/\/www\.gstatic\.com\/firebasejs\/[^/]+\/firebase-(?:app|app-check)\.js$/.test(specifier)) {
      return { url: specifier, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith("https://www.gstatic.com/firebasejs/")) {
      return { format: "module", shortCircuit: true, source: url.endsWith("/firebase-app.js")
        ? "export const getApp = () => ({});"
        : "export class ReCaptchaEnterpriseProvider {} export const initializeAppCheck = () => ({}); export const getToken = async () => ({token:'unit-app-check'});" };
    }
    return next(url, context);
  },
});
