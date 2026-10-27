// scripts/lib/bundles.mjs
// The committed browser bundles and how esbuild builds them.
// scripts/build-api.mjs and scripts/build-dashboard.mjs write them, and
// scripts/bundles-current.test.mjs builds them in memory to prove the
// committed copies match their sources.
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../../", import.meta.url));

const common = {
  absWorkingDir: root,
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
};

// The public environment configuration stays its own module, so changing the
// API origin (or an emulator override) needs no rebuild.
const publicHostConfig = (path) => ({
  name: "public-host-config",
  setup(builder) {
    builder.onResolve({ filter: /host-api-config\.js$/ }, () => ({
      path,
      external: true,
    }));
    for (const config of ["firebase-config.js", "manager-api-config.js"]) {
      builder.onResolve(
        { filter: new RegExp(config.replaceAll(".", "\\.") + "$") },
        () => ({
          // A new App Check registration must reach existing browser sessions
          // as soon as the versioned dashboard bundle is published.
          path:
            path.replace("host-api-config.js", config) +
            (config === "firebase-config.js" ? "?v=20261022m2" : ""),
          external: true,
        }),
      );
    }
  },
});

// js/api/index.js: the typed API client every page imports.
export const apiBundle = {
  ...common,
  entryPoints: ["api/index.ts"],
  outfile: "js/api/index.js",
  plugins: [publicHostConfig("../host-api-config.js")],
};

// js/host-dashboard.bundle.js: everything /dashboard/host/ runs.
export const dashboardBundle = {
  ...common,
  entryPoints: ["js/host-dashboard.js"],
  outfile: "js/host-dashboard.bundle.js",
  plugins: [publicHostConfig("./host-api-config.js")],
  // The vendored QR generator (Try it) keeps its UMD footer, a guarded
  // module.exports the bundle never runs; its ESM default export is used.
  logOverride: { "commonjs-variable-in-esm": "silent" },
};

// js/platform-dashboard.bundle.js: everything the product picker and the Pay
// and Manager pages run. One versioned file, so a page never pairs a new
// entry with an older cached copy of a module it imports.
export const pickerBundle = {
  ...common,
  entryPoints: ["js/platform-dashboard.js"],
  outfile: "js/platform-dashboard.bundle.js",
  plugins: [publicHostConfig("./host-api-config.js")],
  logOverride: { "commonjs-variable-in-esm": "silent" },
};

// The pages that load the picker bundle.
export const pickerPages = [
  "dashboard/index.html",
  "dashboard/pay/index.html",
  "dashboard/manager/index.html",
  "dashboard/manager/platform/index.html",
  "dashboard/platform/index.html",
];

// Static hosting needs a real document for the Platform deep link: the
// overview page is a byte copy of the Host page.
export const hostPage = "dashboard/host/index.html";
export const overviewPage = "dashboard/host/overview/index.html";
