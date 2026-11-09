// scripts/lib/content-security-policy.mjs
// The Content Security Policy of the sign-in pages and the signed-in
// workspaces (product picker, Host, Pay, Manager, Platform management,
// Reservations and the Pay point preview). GitHub Pages cannot send response
// headers, so each page carries it as the first element after <meta charset>:
//   <meta http-equiv="Content-Security-Policy" content="..." />
// A policy delivered that way ignores frame-ancestors, report-uri/report-to and
// sandbox, so it does not protect against clickjacking.
//
// The hand-written workspace documents hold dashboardContentSecurityPolicy()
// verbatim; scripts/login-pages.mjs adds the hash of each sign-in page's one
// inline script. scripts/content-security-policy.test.mjs keeps both in step
// with this file, and scripts/serve.mjs widens connect-src/frame-src for the
// local APIs and Auth Emulator on ports 8000 and 8100 only.
import { createHash } from "node:crypto";

// Every origin a covered page loads code from, frames or connects to.
const DIRECTIVES = Object.freeze({
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    // Firebase Web SDK modules (js/site-auth.js, js/site-app-check.js).
    "https://www.gstatic.com/firebasejs/",
    // Firebase Auth popup support (gapi loader for its __/auth/iframe).
    "https://apis.google.com",
    // reCAPTCHA Enterprise, the App Check provider.
    "https://www.google.com/recaptcha/",
    "https://www.gstatic.com/recaptcha/",
    // Google Analytics after cookie consent (js/cookie-consent.js), wifigate.io only.
    "https://www.googletagmanager.com/gtag/",
  ],
  "connect-src": [
    "'self'",
    // Host and shared account API (js/host-api-config.js).
    "https://api.wifigate.io",
    // Manager API (js/manager-api-config.js): the custom domain and the
    // Cloud Run address, and the Manager relays (state.relayUrl).
    "https://manager.wifigate.io",
    "https://wifigate-manager-api-759449834452.us-central1.run.app",
    "wss://relay.wifigate.io",
    "wss://wifigate-manager-relay-759449834452.us-central1.run.app",
    // Firebase Authentication and App Check token exchange.
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://content-firebaseappcheck.googleapis.com",
    "https://www.google.com/recaptcha/",
    // Google Analytics 4 after consent.
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://*.googletagmanager.com",
  ],
  "img-src": [
    "'self'",
    // Locally generated QR codes (data:) and selected photos (blob:).
    "data:",
    "blob:",
    // Google account profile photos (js/profile-avatar.js).
    "https://*.googleusercontent.com",
    "https://*.google-analytics.com",
    "https://*.googletagmanager.com",
  ],
  // The Host and Manager first-paint loaders use a <style> block.
  "style-src": ["'self'", "'unsafe-inline'"],
  "font-src": ["'self'"],
  "frame-src": [
    // Firebase Auth popup/redirect helper iframe (authDomain).
    "https://eats-wifigate.firebaseapp.com",
    "https://www.google.com/recaptcha/",
    "https://recaptcha.google.com/recaptcha/",
  ],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
});

// The local APIs (8001, 8101), Auth Emulator (9099) and a local Manager relay.
// js/host-api-config.js uses them only when the site itself runs on 8000/8100.
export const LOCAL_SITE_PORTS = Object.freeze([8000, 8100]);
const LOCAL_SOURCES = Object.freeze({
  "connect-src": [
    "http://127.0.0.1:8001",
    "http://127.0.0.1:8101",
    "http://127.0.0.1:9099",
    "ws://127.0.0.1:*",
    "ws://localhost:*",
  ],
  "frame-src": ["http://127.0.0.1:9099"],
});

const serialize = (directives) =>
  Object.entries(directives)
    .map(([name, sources]) => [name, ...sources].join(" "))
    .join("; ");

// An executable <script> without src (no type, "module" or "text/javascript");
// group 1 is its body. JSON data blocks do not run and need no hash.
export const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)(?![^>]*\stype="(?!module"|text\/javascript")[^"]*")[^>]*>([\s\S]*?)<\/script>/g;

/** 'sha256-…' source for an inline <script> body, exactly as it appears in the page. */
export function inlineScriptHash(text) {
  return `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;
}

/** The policy, with optional hashes of the page's own inline scripts. */
export function dashboardContentSecurityPolicy({ scriptHashes = [] } = {}) {
  return serialize({
    ...DIRECTIVES,
    "script-src": [...DIRECTIVES["script-src"], ...scriptHashes],
  });
}

export const contentSecurityPolicyMeta = (policy) =>
  `<meta http-equiv="Content-Security-Policy" content="${policy}" />`;

const META = /(<meta http-equiv="Content-Security-Policy" content=")([^"]*)(")/i;

/** Reads the policy a document carries, or null. */
export function documentContentSecurityPolicy(html) {
  return html.match(META)?.[2] ?? null;
}

/** The same document with the local development sources added to its policy. */
export function withLocalSources(html) {
  return html.replace(META, (match, start, policy, end) => {
    const widened = policy
      .split(";")
      .map((directive) => {
        const name = directive.trim().split(/\s+/)[0];
        return LOCAL_SOURCES[name]
          ? `${directive.trim()} ${LOCAL_SOURCES[name].join(" ")}`
          : directive.trim();
      })
      .join("; ");
    return `${start}${widened}${end}`;
  });
}
