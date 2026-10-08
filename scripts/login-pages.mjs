// scripts/login-pages.mjs
// The sign-in page in every site language, from templates/login.template.html
// and scripts/login-copy/<locale>.mjs: /login/ (English) and /<code>/login/.
// Each page carries its own runtime wording (#login-copy) and the language
// picker with all site languages. Runs inside build-localized-site.mjs, or
// alone: node scripts/login-pages.mjs

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { RTL_LANGUAGES, SITE_LANGUAGES } from "./site-languages.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = path.join(repoRoot, "templates", "login.template.html");
const SOURCE_LOCALE = "he";

// Read by js/host-login.js, js/login-gate-game.js and the MFA dialog at run
// time; every other key is written into the page by the build.
const RUNTIME_KEYS = [
  "close",
  "authenticatorN",
  "verifying",
  "checking",
  "opening",
  "signingIn",
  "humanReady",
  "accessUnavailable",
  "gameTitle",
  "gameInstruction",
  "gameFooter",
  "gameKeyboard",
  "gameGate",
  "gateOpen",
  "gateClosed",
  "gameRetry",
  "gameLocked",
  "gameDone",
  "errorCancelled",
  "errorPopupBlocked",
  "errorInvalidCode",
  "errorMissingCode",
  "errorNetwork",
  "errorMfaCancelled",
  "errorMfaUnsupported",
  "errorUnverifiedEmail",
  "errorUnconfigured",
  "errorServer",
  "errorSessionExpired",
  "errorForbidden",
  "errorGeneric",
];

const segment = (code) => (code === "en" ? "" : `/${code.toLowerCase()}`);
const placeholders = (value) => (value.match(/\{\w+\}/g) ?? []).sort().join(",");
const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export async function loadLoginCopy() {
  const copies = {};
  for (const { code } of SITE_LANGUAGES) {
    const file = path.join(repoRoot, "scripts", "login-copy", `${code}.mjs`);
    copies[code] = (await import(pathToFileURL(file).href)).default;
  }
  return copies;
}

// Hebrew is the source: every locale has its keys and placeholders, and a
// non-English page keeps no English value.
export function validateLoginCopy(copies) {
  const problems = [];
  const source = copies[SOURCE_LOCALE];
  const english = copies.en;
  for (const [locale, copy] of Object.entries(copies)) {
    for (const key of Object.keys(source)) {
      const value = copy[key];
      if (typeof value !== "string" || !value.trim()) {
        problems.push(`${locale}: missing "${key}"`);
        continue;
      }
      if (placeholders(value) !== placeholders(source[key])) {
        problems.push(`${locale}: "${key}" placeholders differ from ${SOURCE_LOCALE}`);
      }
      if (locale !== "en" && value === english[key]) {
        problems.push(`${locale}: "${key}" is still English ("${value}")`);
      }
    }
    for (const key of Object.keys(copy)) {
      if (!(key in source)) problems.push(`${locale}: unknown key "${key}"`);
    }
  }
  return problems;
}

function languageOptions(locale) {
  const names = new Intl.DisplayNames([locale], { type: "language" });
  return SITE_LANGUAGES.map((option) => {
    const current = option.code === locale;
    const localName = names.of(option.code) ?? option.label;
    const dir = RTL_LANGUAGES.has(option.code) ? "rtl" : "ltr";
    return `          <li>
            <a class="language-picker__option" href="${segment(option.code)}/login/" hreflang="${option.code}"${current ? ' aria-current="page"' : ""}>
              <img src="/assets/img/flags/${option.flagSrc}" alt="" width="42" height="28" loading="lazy" decoding="async" />
              <span class="language-picker__names">
                <span class="language-picker__native" lang="${option.code}" dir="${dir}">${escapeHtml(option.label)}</span>
                <span class="language-picker__local">(${escapeHtml(localName)})</span>
              </span>
              <span class="language-picker__check" aria-hidden="true">✓</span>
            </a>
          </li>`;
  }).join("\n");
}

export function renderLoginPage(template, locale, copy) {
  const language = SITE_LANGUAGES.find((option) => option.code === locale);
  const base = segment(locale);
  const link = (href, text) => `<a href="${base}/${href}/">${escapeHtml(text)}</a>`;
  const legal = escapeHtml(copy.legal)
    .replace("{terms}", link("terms-and-conditions", copy.terms))
    .replace("{privacy}", link("privacy-policy", copy.privacy));
  const runtimeCopy = JSON.stringify(
    Object.fromEntries(RUNTIME_KEYS.map((key) => [key, copy[key]])),
  ).replace(/</g, "\\u003c");
  const values = {
    lang: locale,
    dir: RTL_LANGUAGES.has(locale) ? "rtl" : "ltr",
    homeHref: `${base}/`,
    currentFlag: language.flagSrc,
    currentLabel: escapeHtml(language.label),
    languageOptions: languageOptions(locale),
    legal,
    runtimeCopy,
  };
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key in values) return values[key];
    if (typeof copy[key] === "string") return escapeHtml(copy[key]);
    throw new Error(`login.template.html: no value for ${match}`);
  });
}

export async function buildLoginPages(writeFile = defaultWrite) {
  const copies = await loadLoginCopy();
  const problems = validateLoginCopy(copies);
  if (problems.length) {
    throw new Error(
      `Sign-in page copy validation failed (${problems.length} problems):\n  ${problems.join("\n  ")}`,
    );
  }
  const template = (await fs.readFile(templatePath, "utf8")).replace(/\r\n/g, "\n");
  for (const { code } of SITE_LANGUAGES) {
    const file = path.join(repoRoot, ...segment(code).split("/").filter(Boolean), "login", "index.html");
    await writeFile(file, renderLoginPage(template, code, copies[code]));
  }
}

async function defaultWrite(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  buildLoginPages().then(
    () => console.log(`Sign-in pages written for ${SITE_LANGUAGES.length} languages`),
    (error) => {
      console.error(error);
      process.exitCode = 1;
    },
  );
}
