import test from "node:test";
import assert from "node:assert/strict";
import {
  startHostSite,
  openWorkspace,
  organization,
  system,
  booking,
  day,
  loaded,
  requests,
  openSystemAction,
  fits,
} from "./lib/host-booking-site.mjs";

const fixture = (role = "owner", allHidden = false) => ({
  plan: null,
  organizations: [
    organization("hotel", "Hotel One", role),
    organization("other", "Hotel Two", "viewer"),
  ],
  systems: {
    hotel: [
      {
        ...system("room", "Room 101"),
        ...(allHidden ? { calendarEnabled: false } : {}),
      },
      { ...system("lobby", "Lobby"), calendarEnabled: false },
    ],
  },
  reservations: {
    hotel: [
      booking("room-stay", "room", "Room 101", day(1), day(2)),
      booking("lobby-stay", "lobby", "Lobby", day(1), day(2)),
    ],
  },
});

test("calendar selection is consistent in grid, agenda, booking form and Bookings", async (t) => {
  const site = await startHostSite(t);
  for (const width of [1440, 390, 320])
    await t.test(String(width), async () => {
      const { page, errors } = await openWorkspace(t, site, fixture(), {
        query: "?view=calendar",
        viewport: { width, height: 1000 },
      });
      await loaded(page, "calendar");
      const calendar = page.locator(".host-calendar");
      assert.equal(
        await calendar.getByText("Guest lobby-stay", { exact: true }).count(),
        0,
      );
      assert.equal(await calendar.locator('option[value="lobby"]').count(), 0);
      assert.ok(
        await calendar.getByText("Guest room-stay", { exact: true }).count(),
      );
      await page
        .getByText(
          "Some bookings in this range belong to systems excluded from the calendar.",
          { exact: true },
        )
        .waitFor();
      await calendar.locator("[data-new-booking]").click();
      assert.equal(
        await page
          .locator('dialog[open] select[name="systemId"] option[value="lobby"]')
          .count(),
        0,
      );
      await page.keyboard.press("Escape");
      await page.getByLabel("Show unselected systems temporarily").check();
      await calendar
        .getByText("Guest lobby-stay", { exact: true })
        .first()
        .waitFor();
      await calendar.locator("[data-new-booking]").click();
      assert.equal(
        await page
          .locator('dialog[open] select[name="systemId"] option[value="lobby"]')
          .count(),
        1,
      );
      await page.keyboard.press("Escape");
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent("host:workspace-view", { detail: "bookings" }),
        ),
      );
      await loaded(page, "bookings");
      await page.locator('[data-bookings-tab="upcoming"]').click();
      await page
        .locator('[data-workspace-view="bookings"]')
        .getByText("Guest lobby-stay", { exact: false })
        .first()
        .waitFor();
      assert.equal(await fits(page), true);
      assert.deepEqual(errors, []);
    });
});

test("an intentional organization switch confirms discarding unsaved organization details", async (t) => {
  const site = await startHostSite(t);
  const { page, errors } = await openWorkspace(t, site, fixture(), {
    query: "?view=calendar",
  });
  await loaded(page, "calendar");
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent("host:workspace-view", { detail: "settings" }),
    ),
  );
  await loaded(page, "settings");
  await page.locator('[name="name"]').fill("Unsaved hotel name");
  let prompts = 0;
  page.on("dialog", (dialog) => {
    prompts++;
    return dialog.dismiss();
  });
  await page.locator("#workspace-org-switcher button").first().click();
  await page.locator('[data-organization-id="other"]').click();
  assert.equal(prompts, 1);
  assert.equal(
    await page.locator("#host-management").getAttribute("data-organization-id"),
    "hotel",
  );
  assert.equal(
    await page.locator('[name="name"]').inputValue(),
    "Unsaved hotel name",
  );
  assert.deepEqual(errors, []);
});

test("no selected systems has a distinct empty state and only managers can change visibility", async (t) => {
  const site = await startHostSite(t);
  for (const role of ["owner", "staff", "viewer"])
    await t.test(role, async () => {
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture(role, true),
        { query: "?view=calendar" },
      );
      await loaded(page, "calendar");
      await page
        .getByText("No systems are selected for this calendar.", {
          exact: false,
        })
        .waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "Choose calendar systems" })
          .count(),
        role === "owner" ? 1 : 0,
      );
      assert.equal(
        await page.locator(".host-calendar [data-new-booking]:visible").count(),
        0,
      );
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent("host:workspace-view", { detail: "systems" }),
        ),
      );
      await loaded(page, "systems");
      await page
        .locator(
          '.system-card[data-system-id="room"] [data-action="workspace"]',
        )
        .click();
      assert.equal(
        await page.locator('[data-action="calendar"]').count(),
        role === "owner" ? 1 : 0,
      );
      assert.deepEqual(errors, []);
    });
});

test("saving calendar visibility persists a versioned change and invalidates calendar data", async (t) => {
  const site = await startHostSite(t);
  const { page, errors } = await openWorkspace(t, site, fixture(), {
    query: "?view=calendar",
  });
  await loaded(page, "calendar");
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent("host:workspace-view", { detail: "systems" }),
    ),
  );
  await loaded(page, "systems");
  await (await openSystemAction(page, "room", "calendar")).click();
  await page
    .getByLabel("Show in organization calendar", { exact: true })
    .uncheck();
  await page
    .getByRole("button", { name: "Save calendar setting", exact: true })
    .click();
  await page.getByRole("dialog").last().waitFor({ state: "hidden" });
  await loaded(page, "systems");
  const writes = (await requests(page)).filter(
    (r) => r.call === "PUT /api/v1/organizations/hotel/systems/room",
  );
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].body, { version: 3, calendarEnabled: false });
  assert.match(writes[0].key, /^[a-f0-9-]{36}$/);
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent("host:workspace-view", { detail: "calendar" }),
    ),
  );
  await loaded(page, "calendar");
  await page
    .getByText("No systems are selected for this calendar.", { exact: false })
    .waitFor();
  assert.deepEqual(errors, []);
});

test("organization-only employees land on an authorized chooser, including old global links", async (t) => {
  const site = await startHostSite(t);
  for (const query of [
    "",
    "?view=my-organizations",
    "?view=my-systems&org=forbidden",
  ])
    await t.test(query || "home", async () => {
      const { page, errors } = await openWorkspace(t, site, fixture("staff"), {
        query,
        selectOrganization: false,
      });
      await loaded(page, "choose-organization");
      assert.equal(
        await page.locator('[data-view-id="my-systems"]').isVisible(),
        false,
      );
      assert.equal(
        await page.locator('[data-view-id="my-organizations"]').isVisible(),
        false,
      );
      assert.equal(
        (await requests(page)).some(
          (r) =>
            r.call.includes("/me/systems") ||
            /\/organizations\/[^/]+\/(systems|reservations)/.test(r.call),
        ),
        false,
      );
      await page
        .locator('[data-organization="hotel"]')
        .getByRole("button", { name: "Open organization" })
        .click();
      await loaded(page, "systems");
      assert.equal(
        await page
          .locator("#host-management")
          .getAttribute("data-organization-id"),
        "hotel",
      );
      assert.deepEqual(errors, []);
    });
});
