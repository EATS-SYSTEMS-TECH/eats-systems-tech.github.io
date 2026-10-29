import test from "node:test";
import assert from "node:assert/strict";
import { startSite, scenario } from "./platform-test-fixtures.mjs";
const person = (email, name) => ({
  email,
  name,
  role: "user",
  identityStatus: "verified",
  products: {
    host: { state: "blocked" },
    manager: { state: "active" },
    pay: { state: "no-plan" },
  },
});

test("account search covers older server pagination; organization selector and creation stay product scoped", async (t) => {
  const site = await startSite(t);
  for (const language of ["he", "en"])
    for (const width of [390, 1440])
      await t.test(`${language}/${width}`, async (t) => {
        const he = language === "he";
        const f = await scenario(site.browser, {
          platformRole: "admin",
          admin: true,
          enrolled: true,
          verified: true,
          authTime: Math.floor(Date.now() / 1000),
          viewport: { width, height: 1000 },
        });
        t.after(() => f.context.close());
        const calls = [],
          creates = [];
        const organizations = [
          {
            id: "org-manager",
            name: "Manager building",
            status: "active",
            products: { manager: "active" },
          },
          {
            id: "org-host",
            name: "Host building",
            status: "active",
            products: { host: "active" },
          },
        ];
        await f.context.route("**/api/v1/platform/directory?*", (r) => {
          const u = new URL(r.request().url());
          calls.push(u.search);
          if (u.searchParams.has("q"))
            return r.fulfill({
              status: 400,
              json: { error: { code: "INVALID_REQUEST" } },
            });
          return r.fulfill({
            json: {
              counts: { admins: 0, users: 2, total: 2 },
              productCounts: { host: 2, pay: 0, manager: 2 },
              items: u.searchParams.has("after")
                ? [person("target@example.test", "Hidden target")]
                : [person("alpha@example.test", "Alpha")],
              nextCursor: u.searchParams.has("after")
                ? null
                : "alpha@example.test",
            },
          });
        });
        await f.context.route(
          "**/api/v1/platform/directory/organization-overview?*",
          (r) => {
            const p = new URL(r.request().url()).searchParams.get("product");
            return r.fulfill({
              json: {
                items: organizations.filter(
                  (o) => p === "all" || o.products[p],
                ),
                complete: true,
              },
            });
          },
        );
        await f.context.route("**/api/v1/organizations", (r) => {
          const body = r.request().postDataJSON();
          creates.push({ body, key: r.request().headers()["idempotency-key"] });
          organizations.push({
            id: "new-host",
            name: body.name,
            status: "active",
            products: { host: "active" },
          });
          return r.fulfill({
            status: 201,
            json: { organization: { id: "new-host", name: body.name } },
          });
        });
        await f.page.goto(
          site.origin + "/dashboard/platform/?lang=" + language,
        );
        const search = f.page.getByRole("searchbox", {
          name: he ? "חיפוש חשבון" : "Search accounts",
        });
        await search.fill("Hidden target");
        await f.page.getByText("Hidden target", { exact: true }).waitFor();
        assert.equal(
          await f.page.getByText("Alpha", { exact: true }).count(),
          0,
        );
        assert.ok(calls.some((q) => q.includes("after=")));
        await f.page.locator('[data-role="organizations"]').click();
        const picker = f.page.getByRole("combobox", {
          name: he ? "בחירת ארגון" : "Choose organization",
        });
        await picker.selectOption("org-manager");
        assert.equal(
          await f.page.locator(".platform-admin-organization").count(),
          1,
        );
        assert.equal(
          await f.page.locator(".platform-admin-organization h4").innerText(),
          "Manager building",
        );
        await f.page
          .getByRole("button", {
            name: he ? "יצירת ארגון חדש" : "Create organization",
            exact: true,
          })
          .click();
        const modal = f.page.locator("dialog[open]");
        await modal.locator('[name="product"]').selectOption("host");
        await modal.locator('[name="name"]').fill("Created building");
        assert.equal(await modal.locator('[name="email"]').isDisabled(), true);
        await modal.locator('button[type="submit"]').click();
        await modal.waitFor({ state: "detached" });
        await f.page
          .getByRole("heading", { name: "Created building", exact: true })
          .waitFor();
        assert.equal(creates.length, 1);
        assert.equal(creates[0].body.name, "Created building");
        assert.ok(creates[0].body.timezone);
        assert.match(creates[0].key, /^[a-f0-9-]{36}$/);
        assert.equal(await picker.inputValue(), "new-host");
        assert.equal(
          await f.page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        assert.deepEqual(f.errors, []);
      });
});

test("Manager creation uses its existing owner account API and unavailable Pay creation never claims success", async (t) => {
  const site = await startSite(t);
  const f = await scenario(site.browser, {
    platformRole: "admin",
    admin: true,
    enrolled: true,
    verified: true,
    authTime: Math.floor(Date.now() / 1000),
  });
  t.after(() => f.context.close());
  let payReady = false, payCreated = false;
  await f.context.route(
    "**/api/v1/platform/directory/organization-overview?*",
    (r) => r.fulfill({ json: { items: payCreated ? [{id:"pay-new",name:"Pay pending",status:"active",products:{pay:"active"}}] : [], complete: true } }),
  );
  const writes = [];
  await f.context.route("**/api/v1/manager/admin/organizations", (r) => {
    writes.push(r.request().postDataJSON());
    return r.fulfill({
      status: 201,
      json: { organization: { id: "manager-new" } },
    });
  });
  const payKeys = [];
  await f.context.route("**/api/v1/platform/directory/organizations", (r) => {
    payKeys.push(r.request().headers()["idempotency-key"]);
    if(payReady){payCreated=true;return r.fulfill({status:201,json:{organization:{id:"pay-new"}}});}
    return r.fulfill({ status: 404, json: { error: { code: "NOT_FOUND" } } });
  });
  await f.page.goto(site.origin + "/dashboard/platform/?lang=he");
  await f.page.locator('[data-role="organizations"]').click();
  await f.page
    .getByRole("button", { name: "יצירת ארגון חדש", exact: true })
    .click();
  let modal = f.page.locator("dialog[open]");
  await modal.locator("[name=name]").fill("Manager created");
  await modal.locator("[name=email]").fill("owner@example.test");
  await modal.locator("[type=submit]").click();
  await modal.waitFor({ state: "detached" });
  assert.equal(writes.length, 1);
  assert.equal(writes[0].email, "owner@example.test");
  assert.match(writes[0].requestId, /^[a-f0-9-]{36}$/);
  await f.page
    .getByRole("button", { name: "יצירת ארגון חדש", exact: true })
    .click();
  modal = f.page.locator("dialog[open]");
  await modal.locator("[name=product]").selectOption("pay");
  await modal.locator("[name=name]").fill("Pay pending");
  await modal.locator("[type=submit]").click();
  await modal.getByText(/ממתינה לפריסת עדכון השרת/).waitFor();
  await modal.locator("[type=submit]").click();
  await modal.locator("[type=submit]").waitFor({state:"visible"});
  await f.page.waitForFunction(()=>!document.querySelector("dialog[open]")?.hasAttribute("aria-busy"));
  assert.equal(payKeys.length, 2);
  assert.equal(payKeys[0], payKeys[1]);
  assert.equal(await modal.isVisible(), true);
  payReady=true;
  await modal.locator("[type=submit]").click();
  await modal.waitFor({state:"detached"});
  await f.page.getByRole("heading",{name:"Pay pending",exact:true}).waitFor();
  assert.equal(payKeys.length,3);
  assert.equal(payKeys[2],payKeys[0]);
  assert.deepEqual(f.errors, []);
});
