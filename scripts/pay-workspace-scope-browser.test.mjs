import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

async function open(
  t,
  site,
  {
    personalRole = null,
    role = "user",
    organizationRole = "staff",
    language = "en",
    missing = false,
    query = "",
    secondOrganization = false,
    systems = false,
  } = {},
) {
  const page = await site.browser.newPage({
    viewport: { width: 390, height: 900 },
  });
  t.after(() => page.close());
  page.setDefaultTimeout(7000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route(site.origin + "/pay-scope-fixture**", (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"><link rel="stylesheet" href="/css/pay-dashboard.css"><body class="platform-page" data-product="pay"><main class="platform-shell"><section class="portal-panel"><div id="root"></div></section></main>`,
    }),
  );
  await page.goto(site.origin + "/pay-scope-fixture" + query);
  await page.evaluate(
    async ({
      personalRole,
      role,
      organizationRole,
      language,
      missing,
      secondOrganization,
      systems,
    }) => {
      const { createPayDashboard } = await import("/js/pay-dashboard.js");
      window.state = {
        profile: {
          user: { uid: "person" },
          role,
          ...(missing ? {} : { personalRole }),
          canManageSystems: true,
          uploadEnabled: true,
          paymentsEnabled: false,
          organizations: [
            { id: "hotel-one", name: "Hotel One", role: organizationRole },
            ...(secondOrganization
              ? [{ id: "hotel-two", name: "Hotel Two", role: organizationRole }]
              : []),
          ],
        },
        calls: [],
        meComplete: false,
      };
      const system = {
        id: "point-one",
        name: "Car park",
        type: "gate",
        targetId: "gate-one",
        systemIds: ["gate-one"],
        version: 1,
        capabilities: {
          paymentModes: ["single-entry"],
          paymentsEnabled: false,
        },
        config: {
          displayName: "Car park",
          description: "",
          currency: "ILS",
          priceMinor: 1200,
          accessMode: "single-entry",
          graceMinutes: 0,
          maxSessionMinutes: 1440,
          validityMin: 15,
          enabled: false,
        },
        permissions: {
          canConfigure: true,
          canRemove: false,
          canAssignOrganization: false,
        },
      };
      window.mountDashboard = () =>
        createPayDashboard({
          root: document.querySelector("#root"),
          user: { uid: "person" },
          language,
          api: async (raw, method = "GET") => {
            if (method !== "GET")
              throw new Error("Scope navigation must not write data");
            const url = new URL(raw, location.origin);
            state.calls.push(url.pathname + url.search);
            if (url.pathname === "/api/v1/pay/me") {
              state.meComplete = false;
              await new Promise((resolve) => setTimeout(resolve, 15));
              state.meComplete = true;
              return structuredClone(state.profile);
            }
            if (!state.meComplete)
              throw new Error("Inventory requested before profile resolved");
            if (url.pathname === "/api/v1/pay/systems/point-one")
              return { system, paymentsEnabled: false };
            return {
              items: systems ? [system] : [],
              nextCursor: null,
              paymentsEnabled: false,
            };
          },
        });
      window.dashboard = window.mountDashboard();
      await window.dashboard.ready;
    },
    {
      personalRole,
      role,
      organizationRole,
      language,
      missing,
      secondOrganization,
      systems,
    },
  );
  return { page, errors };
}

test("Pay organization-only employees choose scope without personal links or inventory requests", async (t) => {
  const site = await startSite(t);
  for (const language of ["en", "he"])
    for (const organizationRole of ["owner", "admin", "staff", "viewer"]) {
      await t.test(`${language} ${organizationRole}`, async (t) => {
        const { page, errors } = await open(t, site, {
          language,
          organizationRole,
        });
        assert.equal(
          await page.locator(".manager-personal-navigation").count(),
          0,
        );
        assert.equal(
          await page.getByText("WIFIGATE Pay User", { exact: true }).count(),
          0,
        );
        assert.equal(await page.locator("[data-organization-view]").count(), 0);
        assert.deepEqual(await page.evaluate(() => state.calls), [
          "/api/v1/pay/me",
        ]);
        const choose = page.locator(".manager-organization-picker-trigger");
        await choose.click();
        await page.locator('[data-organization-id="hotel-one"]').click();
        await page.locator('[data-organization-view="systems"]').waitFor();
        await page.waitForFunction(
          () =>
            document.querySelector(".pay-content").getAttribute("aria-busy") ===
            "false",
        );
        assert.deepEqual(await page.evaluate(() => state.calls), [
          "/api/v1/pay/me",
          "/api/v1/pay/me",
          "/api/v1/pay/systems?limit=50&organizationId=hotel-one",
        ]);
        assert.equal(
          await page.locator(".manager-personal-navigation").count(),
          0,
        );
        assert.equal(
          await page.evaluate(() => document.body.dataset.organizationRole),
          organizationRole,
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          true,
        );
        assert.deepEqual(errors, []);
      });
    }
});

test("Pay requires explicit personalRole and resolves profile before personal inventory", async (t) => {
  const site = await startSite(t);
  for (const personalRole of ["user", "admin"]) {
    await t.test(personalRole, async (t) => {
      const { page, errors } = await open(t, site, {
        personalRole,
        role: personalRole,
      });
      assert.equal(
        await page
          .locator(".manager-personal-navigation")
          .getByRole("button", { name: "My systems", exact: true })
          .count(),
        1,
      );
      assert.equal(
        await page
          .locator(".manager-personal-navigation")
          .getByRole("button", { name: "My organizations", exact: true })
          .count(),
        1,
      );
      assert.deepEqual(await page.evaluate(() => state.calls), [
        "/api/v1/pay/me",
        "/api/v1/pay/systems?limit=50",
      ]);
      assert.deepEqual(errors, []);
    });
  }
  for (const options of [
    { missing: true, role: "admin" },
    { personalRole: "owner" },
    { personalRole: true },
  ]) {
    const { page, errors } = await open(t, site, options);
    assert.equal(await page.locator(".manager-personal-navigation").count(), 0);
    assert.deepEqual(await page.evaluate(() => state.calls), [
      "/api/v1/pay/me",
    ]);
    assert.deepEqual(errors, []);
  }
});

test("Pay rechecks organization membership before loading systems and clears a revoked workspace", async (t) => {
  const site = await startSite(t);
  const { page, errors } = await open(t, site);
  await page.locator(".manager-organization-picker-trigger").click();
  await page.locator('[data-organization-id="hotel-one"]').click();
  await page.locator(".pay-organization-header").waitFor();
  await page.evaluate(async () => {
    state.calls = [];
    state.profile.organizations = [];
    await dashboard.refresh();
  });
  assert.deepEqual(await page.evaluate(() => state.calls), ["/api/v1/pay/me"]);
  assert.equal(await page.locator(".pay-organization-header").count(), 0);
  assert.equal(await page.locator("[data-organization-view]").count(), 0);
  assert.equal(await page.locator(".manager-personal-navigation").count(), 0);
  assert.equal(
    await page.evaluate(() => document.body.dataset.organizationRole),
    undefined,
  );
  assert.equal(
    await page
      .getByRole("heading", { name: "Choose organization", exact: true })
      .count(),
    1,
  );
  assert.deepEqual(errors, []);
});

test("Pay invalid identity never requests inventory and exposes a retry", async (t) => {
  const site = await startSite(t);
  const { page, errors } = await open(t, site, { personalRole: "user" });
  await page.evaluate(async () => {
    state.calls = [];
    state.profile.user.uid = "another-person";
    await dashboard.refresh();
  });
  assert.deepEqual(await page.evaluate(() => state.calls), ["/api/v1/pay/me"]);
  assert.equal(await page.locator(".manager-personal-navigation").count(), 0);
  assert.equal(
    await page.getByRole("button", { name: "Try again", exact: true }).count(),
    1,
  );
  assert.deepEqual(errors, []);
});

const chooseOrganization = async (page, id) => {
  await page.locator(".manager-organization-picker-trigger").click();
  await page.locator(`[data-organization-id="${id}"]`).click();
};
const waitOrganization = async (page, name) => {
  await page.getByRole("heading", { name, exact: true }).waitFor();
  await page.waitForFunction(
    () =>
      document.querySelector(".pay-content")?.getAttribute("aria-busy") ===
      "false",
  );
};

test("Pay organization URLs survive remount and history while rechecking current membership", async (t) => {
  const site = await startSite(t);
  for (const language of ["en", "he"]) {
    const { page, errors } = await open(t, site, {
      language,
      secondOrganization: true,
      query: `?org=hotel-one&view=systems&lang=${language}`,
    });
    await waitOrganization(page, "Hotel One");
    assert.deepEqual(await page.evaluate(() => state.calls), [
      "/api/v1/pay/me",
      "/api/v1/pay/systems?limit=50&organizationId=hotel-one",
    ]);
    await chooseOrganization(page, "hotel-two");
    await waitOrganization(page, "Hotel Two");
    assert.equal(new URL(page.url()).searchParams.get("org"), "hotel-two");
    assert.equal(new URL(page.url()).searchParams.get("lang"), language);
    await page.evaluate(async () => {
      dashboard.close();
      state.calls = [];
      window.dashboard = mountDashboard();
      await dashboard.ready;
    });
    await waitOrganization(page, "Hotel Two");
    assert.deepEqual(await page.evaluate(() => state.calls), [
      "/api/v1/pay/me",
      "/api/v1/pay/systems?limit=50&organizationId=hotel-two",
    ]);
    await page.evaluate(() => {
      state.calls = [];
      history.back();
    });
    await waitOrganization(page, "Hotel One");
    assert.deepEqual(await page.evaluate(() => state.calls), [
      "/api/v1/pay/me",
      "/api/v1/pay/systems?limit=50&organizationId=hotel-one",
    ]);
    await page.evaluate(() => {
      state.calls = [];
      history.forward();
    });
    await waitOrganization(page, "Hotel Two");
    await page.evaluate(() => {
      state.profile.organizations = state.profile.organizations.filter(
        (org) => org.id === "hotel-two",
      );
      state.calls = [];
      history.back();
    });
    await page.waitForFunction(
      () => !new URL(location.href).searchParams.has("org"),
    );
    assert.equal(
      new URL(page.url()).searchParams.get("view"),
      "choose-organization",
    );
    assert.equal(new URL(page.url()).searchParams.get("lang"), language);
    assert.equal(await page.locator(".pay-organization-header").count(), 0);
    assert.deepEqual(await page.evaluate(() => state.calls), [
      "/api/v1/pay/me",
    ]);
    assert.deepEqual(errors, []);
  }
});

test("Pay foreign organization deep links never fetch that organization's systems", async (t) => {
  const site = await startSite(t);
  const { page, errors } = await open(t, site, {
    query: "?org=foreign-hotel&view=systems&lang=he",
  });
  assert.deepEqual(await page.evaluate(() => state.calls), ["/api/v1/pay/me"]);
  assert.equal(new URL(page.url()).searchParams.has("org"), false);
  assert.equal(
    new URL(page.url()).searchParams.get("view"),
    "choose-organization",
  );
  assert.equal(new URL(page.url()).searchParams.get("lang"), "he");
  assert.deepEqual(errors, []);
});

test("Pay confirms dirty tariff edits before organization switches and browser history", async (t) => {
  const site = await startSite(t);
  for (const language of ["en", "he"]) {
    const { page, errors } = await open(t, site, {
      language,
      secondOrganization: true,
      systems: true,
      organizationRole: "admin",
      query: `?org=hotel-one&view=systems&lang=${language}`,
    });
    const edit = async () => {
      await page.locator('[data-system-id="point-one"] button').click();
      await page.locator('[data-pay-tab="settings"]').click();
      await page.locator('[name="displayName"]').fill("Unsaved tariff name");
      await page.evaluate(() => {
        state.calls = [];
      });
    };
    await edit();
    page.once("dialog", async (dialog) => {
      assert.equal(
        dialog.message(),
        language === "he"
          ? "לעזוב את סביבת העבודה ולמחוק שינויים שלא נשמרו?"
          : "Leave this workspace and discard unsaved changes?",
      );
      await dialog.dismiss();
    });
    await chooseOrganization(page, "hotel-two");
    assert.equal(
      await page.locator('[name="displayName"]').inputValue(),
      "Unsaved tariff name",
    );
    assert.equal(new URL(page.url()).searchParams.get("org"), "hotel-one");
    assert.deepEqual(await page.evaluate(() => state.calls), []);
    page.once("dialog", (dialog) => dialog.accept());
    await chooseOrganization(page, "hotel-two");
    await waitOrganization(page, "Hotel Two");
    assert.equal(await page.locator(".pay-settings-form").count(), 0);
    await edit();
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.evaluate(() => history.back());
    await page.waitForFunction(
      () => new URL(location.href).searchParams.get("org") === "hotel-two",
    );
    assert.equal(
      await page.locator('[name="displayName"]').inputValue(),
      "Unsaved tariff name",
    );
    assert.deepEqual(await page.evaluate(() => state.calls), []);
    page.once("dialog", (dialog) => dialog.accept());
    await page.evaluate(() => history.back());
    await waitOrganization(page, "Hotel One");
    assert.equal(await page.locator(".pay-settings-form").count(), 0);
    assert.deepEqual(await page.evaluate(() => state.calls), [
      "/api/v1/pay/me",
      "/api/v1/pay/systems?limit=50&organizationId=hotel-one",
    ]);
    assert.deepEqual(errors, []);
  }
});
