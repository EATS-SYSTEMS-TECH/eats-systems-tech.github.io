import test from "node:test";
import assert from "node:assert/strict";
import { startSite, scenario } from "./platform-test-fixtures.mjs";
import { installAppCheckFixture } from "./app-check-browser-fixture.mjs";

test("all website clients attach App Check alongside user auth, including exports and Manager", async (t) => {
  const { origin, browser } = await startSite(t);
  const fixture = await scenario(browser);
  t.after(() => fixture.context.close());
  const seen = [];
  await fixture.context.route("**/api/v1/**", (route) => {
    seen.push(route.request().headers());
    return route.fulfill({ json: {} });
  });
  await fixture.context.route(origin + "/integrity-fixture", (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html><body></body>" }));
  await fixture.page.goto(origin + "/integrity-fixture");
  await fixture.page.evaluate(async () => {
    const api = await import("/js/api/index.js");
    const user = { getIdToken: async () => "fixture-id-token" };
    await api.getPlatformProfile(user);
    await api.getProfile(user);
    await api.portalRequest(user, "/api/v1/organizations/org/reservations", "POST", {}, "stable-intent");
    await api.portalExport(user, "/api/v1/organizations/org/operations/usage/export");
    await api.managerRequest(user, "/api/v1/manager/me");
  });
  assert.equal(seen.length, 5);
  for (const headers of seen) {
    assert.equal(headers.authorization, "Bearer fixture-id-token");
    assert.equal(headers["x-firebase-appcheck"], "browser-app-check");
  }
  assert.equal(seen[2]["idempotency-key"], "stable-intent");
});

test("invalid App Check fails locally before any Host or Manager request is sent", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const token of ["", "bad token"]) {
    const fixture = await scenario(browser);
    t.after(() => fixture.context.close());
    await installAppCheckFixture(fixture.context, token);
    let requests = 0;
    await fixture.context.route("**/api/v1/**", (route) => { requests++; return route.fulfill({ json: {} }); });
    await fixture.context.route(origin + "/integrity-fixture", (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html><body></body>" }));
    await fixture.page.goto(origin + "/integrity-fixture");
    const errors = await fixture.page.evaluate(async () => {
      const api = await import("/js/api/index.js");
      const user = { getIdToken: async () => "fixture-id-token" };
      const codes = [];
      for (const call of [() => api.getPlatformProfile(user), () => api.managerRequest(user, "/api/v1/manager/me")]) {
        try { await call(); } catch (error) { codes.push(error.code); }
      }
      return codes;
    });
    assert.deepEqual(errors, ["APP_CHECK_REQUIRED", "APP_CHECK_REQUIRED"]);
    assert.equal(requests, 0);
  }
});
