# Website dependency audit

Scope: `wifigate-static-site` browser and build dependencies (`package.json`, `package-lock.json`).
Date: **2026-09-29**.

The site is static HTML with a bundled Axios API client in `js/api/index.js`.
`cheerio`, `sharp`, `esbuild`, and `typescript` are build-time dependencies.

## Status

* `npm audit --omit=dev --audit-level=high`: **0 vulnerabilities**.
* `npm audit --audit-level=high`: **0 high/critical**, 12 moderate findings in
  development tooling and its transitive dependencies.

The high-severity `sharp` advisory found during this update was addressed by
upgrading `sharp` to `0.35.5`. The remaining moderate findings are in the
development dependency tree; the dependency check rejects high/critical
findings.

## Dependency check

Run locally before each release: `npm ci` and `npm audit --audit-level=high`.
Any high or critical advisory blocks the release. Because there are no accepted exceptions, no allow-list is needed; if
one is ever required, adopt the allow-list gate used by the mobile app.
