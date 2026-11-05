import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  startHostSite,
  openWorkspace,
  organization,
  system,
  loaded,
  fits,
  requests,
} from "./lib/host-booking-site.mjs";

test("Host API keys: role actions, UTC usage, safe code examples, paid consent and RTL/mobile layout", async (t) => {
  const site = await startHostSite(t);
  const shots = path.join(tmpdir(), "wifigate-host-api-review");
  await mkdir(shots, { recursive: true });
  for (const lang of ["en", "he"]) {
    const state = {
      plan: "user",
      uid: "creator",
      organizations: [organization("hotel", "Hotel Hadar", "admin")],
      systems: {
        hotel: [
          system("room101", "Room 101"),
          {
            ...system("shutter", "Lobby shutter", "dual-control"),
            category: "ROLLER_SHUTTER",
          },
        ],
      },
      apiKeys: {
        hotel: Array.from({ length: 5 }, (_, index) => ({
          id: `key-${index}`,
          name: index === 0 ? "Reception PMS" : `Integration ${index}`,
          prefix: `wfg_live_k_public${index}`,
          version: 1,
          status: "active",
          ownerUid: index === 0 ? "creator" : "other",
          ownerEmail:
            index === 0 ? "reception@example.test" : "owner@example.test",
          canManage: index === 0,
          canRevoke: index === 0,
          scopes: [
            "guest-invitations:create",
            "reservations:read",
            "reservations:write",
          ],
          targetTypes: ["gate"],
          invitationsToday: 7,
          invitations30Days: 60,
          invitationsMeasured: 145,
          lastUsedAt: "2026-11-05T09:00:00Z",
        })),
      },
    };
    const { page, errors } = await openWorkspace(t, site, state, {
      query: `?view=api-keys&lang=${lang}`,
      real: true,
    });
    await loaded(page, "api-keys");
    assert.equal(await page.locator('[data-view-id="connect"]').count(), 0);
    assert.equal(await page.locator('[data-view-id="activity"]').count(), 0);
    assert.equal(await page.locator(".host-api-table tbody tr").count(), 5);
    await page.locator(".host-api-actions > summary").first().click();
    assert.equal(
      await page.locator('[data-api-key="key-1"] .host-api-actions').count(),
      0,
    );
    await page
      .locator('[data-api-key="key-0"] .host-api-actions > button')
      .click();
    await page.locator(".host-api-private textarea").waitFor();
    assert.equal(
      await page.locator(".host-api-private textarea").inputValue(),
      "wfg_test_private_value",
    );
    await page.locator(".host-api-private button").click();
    await page.locator(".host-api-create > summary").click();
    await page.locator('input[name="name"]').fill("New connection");
    assert.equal(
      await page.locator('input[name="paidKeyConsent"]').isVisible(),
      true,
    );
    await page.locator('.host-api-create button[type="submit"]').click();
    assert.equal(
      (await requests(page)).filter(
        (row) => row.call === "POST /api/v1/organizations/hotel/api-keys",
      ).length,
      0,
    );
    await page.locator('input[name="paidKeyConsent"]').check();
    await page.locator('.host-api-create button[type="submit"]').click();
    await page.waitForFunction(() =>
      window.fixture.requests.some(
        (row) => row.call === "POST /api/v1/organizations/hotel/api-keys",
      ),
    );
    const created = (await requests(page)).find(
      (row) => row.call === "POST /api/v1/organizations/hotel/api-keys",
    );
    assert.equal(created.body.paidKeyConsent, true);
    assert.deepEqual(created.body.scopes, [
      "guest-invitations:create",
      "reservations:read",
      "reservations:write",
    ]);
    await page.locator('[data-api-key="key-0"] td:last-child > button').click();
    await page
      .locator(".host-api-chart .host-api-bar")
      .first()
      .waitFor({ state: "attached" });
    assert.equal(await page.locator(".host-api-bar").count(), 30);
    assert.match(
      await page.locator(".host-api-errors").innerText(),
      /SCOPE_DENIED: 1/,
    );
    await page.locator(".host-api-examples > summary").click();
    const selects = page.locator(".host-api-example-controls select");
    await selects.nth(1).selectOption("ROLLER_SHUTTER");
    await selects.nth(2).selectOption("shutter");
    for (const language of [
      "curl",
      "node-fetch",
      "node-axios",
      "python-requests",
      "python-httpx",
      "php-curl",
      "php-guzzle",
      "csharp",
    ]) {
      await selects.first().selectOption(language);
      const code = await page
        .locator(".host-api-examples pre code")
        .innerText();
      assert.match(code, /YOUR_HOST_API_KEY/);
      assert.match(code, /"systemId": "shutter"/);
      assert.match(code, /accessNote/);
      assert.doesNotMatch(code, /wfg_test_private_value/);
    }
    await page.locator(".host-api-examples > summary").click();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      assert(await fits(page), `${lang} fits ${width}`);
      await page.screenshot({
        path: path.join(shots, `${lang}-${width}.png`),
        fullPage: true,
      });
    }
    await page
      .locator('#host-section-navigation [data-view-id="settings"]')
      .click();
    await page.locator('[data-settings-tab="connections"]').click();
    await page
      .locator('[data-settings-panel="connections"][data-loaded="true"]')
      .waitFor();
    assert.equal(await page.locator(".host-api-private textarea").count(), 0);
    assert.deepEqual(errors, []);
  }
});
