# Website dependency audit

Scope: `wifigate-static-site` build tooling (`package.json`, `package-lock.json`).
Date: **2026-09-01**.

The site is static HTML: **no third-party JavaScript is shipped to visitors**.
`cheerio` and `sharp` are `devDependencies` used only by the build scripts
(`scripts/build-localized-site.mjs`, `scripts/build-niche-images.mjs`) on the
build machine.

## Status

* `npm audit --omit=dev`: **0 vulnerabilities** (production tree clean).
* `npm audit` (full tree): **0 vulnerabilities**.

The one previously reported high — `undici` `7.28.0` (a transitive dependency of
`cheerio`, used only by its network fetch helper, not by the HTML parser the
build uses) — was resolved with `npm audit fix`, which bumped it to `7.29.0`.
`cheerio` and `sharp` were smoke-tested after the bump.

## CI gate

`.github/workflows/dependency-audit.yml` runs `npm ci` and
`npm audit --audit-level=high`, failing the build on any high or critical
advisory. Because there are no accepted exceptions, no allow-list is needed; if
one is ever required, adopt the allow-list gate used by the mobile app.
