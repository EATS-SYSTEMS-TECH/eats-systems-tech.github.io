import test from "node:test";
import assert from "node:assert/strict";
import { startSite, scenario } from "./platform-test-fixtures.mjs";
test("organization deletion confirms the exact target, preserves failures and refreshes after success", async (t) => {
  const site = await startSite(t);
  for (const language of ["he", "en"])
    for (const width of [390, 1440])
      await t.test(language + "/" + width, async (t) => {
        const he = language === "he",
          f = await scenario(site.browser, {
            platformRole: "admin",
            admin: true,
            enrolled: true,
            verified: true,
            authTime: Math.floor(Date.now() / 1000),
            viewport: { width, height: 1000 },
          });
        t.after(() => f.context.close());
        let deleted = false,
          blocked = true;
        const writes = [];
        await f.context.route(
          "**/api/v1/platform/directory/organization-overview?*",
          (r) =>
            r.fulfill({
              json: {
                items: deleted
                  ? []
                  : [
                      {
                        id: "target-org",
                        name: "Test organization",
                        version: 4,
                        status: "active",
                        products: {
                          manager: "active",
                          host: "active",
                          pay: "active",
                        },
                      },
                    ],
                complete: true,
              },
            }),
        );
        await f.context.route(
          "**/api/v1/platform/directory/organizations/target-org/delete",
          (r) => {
            writes.push({
              body: r.request().postDataJSON(),
              key: r.request().headers()["idempotency-key"],
            });
            if (blocked)
              return r.fulfill({
                status: 409,
                json: { error: { code: "ORGANIZATION_HAS_SYSTEMS" } },
              });
            deleted = true;
            return r.fulfill({ json: { id: "target-org", archived: true } });
          },
        );
        await f.page.goto(
          site.origin + "/dashboard/platform/?lang=" + language,
        );
        await f.page.locator('[data-role="organizations"]').click();
        const remove = f.page.getByRole("button", {
          name:
            (he ? "מחיקת ארגון: " : "Delete organization: ") +
            "Test organization",
          exact: true,
        });
        await remove.click();
        let dialog = f.page.locator("dialog[open]");
        const submit = dialog.locator('button[type="submit"]');
        assert.equal(await submit.isDisabled(), true);
        await dialog.locator('input[name="confirmName"]').fill("Wrong");
        assert.equal(await submit.isDisabled(), true);
        await dialog
          .getByRole("button", { name: he ? "ביטול" : "Cancel", exact: true })
          .click();
        assert.equal(writes.length, 0);
        await remove.click();
        dialog = f.page.locator("dialog[open]");
        await dialog
          .locator('input[name="confirmName"]')
          .fill("Test organization");
        await dialog.locator('button[type="submit"]').click();
        await dialog
          .getByText(he ? /לא בוצעה מחיקה/ : /Nothing was deleted/)
          .waitFor();
        assert.equal(await remove.count(), 1);
        assert.equal(writes.length, 1);
        blocked = false;
        await dialog.locator('button[type="submit"]').click();
        await dialog.waitFor({ state: "detached" });
        await remove.waitFor({ state: "detached" });
        assert.equal(writes.length, 2);
        assert.equal(writes[0].key, writes[1].key);
        assert.deepEqual(writes[1].body, {
          confirmName: "Test organization",
          expectedVersion: 4,
        });
        assert.equal(
          await f.page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        assert.deepEqual(f.errors, []);
      });
});
