import assert from "node:assert/strict";
import { test } from "node:test";
import {
  startHostSite,
  openWorkspace,
  organization,
  system,
  booking,
  day,
  loaded,
  requests,
  fits,
} from "./lib/host-booking-site.mjs";

// The booking sheet, a booking's details and the Bookings list against the
// in-memory Host API: the clock-change question, edits, a paused service,
// guest links shown again, refusals that cannot be retried, long links,
// deleting a guest's details after a fresh sign-in, phone search and the
// newest-first Past and Cancelled tabs.
const fixture = (role = "owner", extra = {}, orgOptions = {}) => ({
  plan: null,
  organizations: [organization("org", "Grand Hotel", role, orgOptions)],
  systems: { org: [system("s1", "Room 101"), system("s2", "Lobby door")] },
  reservations: { org: [booking("b1", "s1", "Room 101", day(1), day(3))] },
  ...extra,
});
const path = "/api/v1/organizations/org/reservations";
const calls = async (page, call) =>
  (await requests(page)).filter((entry) => entry.call === call);
const sheet = (page) => page.locator("dialog.booking-sheet[open]");
const status = (page) => sheet(page).locator(".booking-sheet__status");
const button = (page, name) =>
  sheet(page).getByRole("button", { name, exact: true });

async function newBooking(page, { systemId = "s2", name = "Dana Levi" } = {}) {
  await page.locator("[data-new-booking]").click();
  const form = sheet(page);
  await form.locator('select[name="systemId"]').selectOption(systemId);
  await form.locator('input[name="name"]').fill(name);
  await form.locator('select[name="country"]').selectOption("IL");
  await form.locator('input[name="phone"]').fill("050-123-4567");
}
const openBooking = async (page, id) => {
  await page.locator(`[data-booking-id="${id}"]`).first().click();
  await sheet(page).waitFor();
};

test("booking sheet, details and the Bookings list", async (t) => {
  const site = await startHostSite(t);

  await t.test(
    "the clock-change question appears only when the time happens twice",
    async () => {
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture("owner", { ambiguous: `${day(0)}T15:00` }),
        { query: "?view=calendar" },
      );
      await loaded(page, "calendar");
      const clock = sheet(page).locator(".booking-form__clock");
      await newBooking(page);
      assert.equal(await clock.isVisible(), false);
      await button(page, "Create guest link").click();
      await sheet(page).locator(".booking-form__clock:not([hidden])").waitFor();
      assert.equal(
        await status(page).textContent(),
        "That time happens twice that night. Choose which one.",
      );
      assert.equal((await calls(page, `POST ${path}`)).length, 0);
      await clock.locator('input[value="later"]').check();
      await button(page, "Create guest link").click();
      await sheet(page).locator("[data-guest-link]").waitFor();
      const asked = (await calls(page, `POST ${path}/time-zone/resolve`))
        .map((entry) => entry.body)
        .filter((body) => body.localTime === `${day(0)}T15:00`);
      assert.deepEqual(
        asked.map((body) => body.disambiguation),
        ["reject", "later"],
      );
      assert.equal((await calls(page, `POST ${path}`)).length, 1);
      assert.deepEqual(errors, []);
    },
  );

  await t.test("Edit sends the whole booking with its version", async () => {
    const { page, errors } = await openWorkspace(t, site, fixture(), {
      query: "?view=calendar",
    });
    await loaded(page, "calendar");
    await openBooking(page, "b1");
    await sheet(page).locator("[data-booking-edit]").click();
    await sheet(page).getByRole("heading", { name: "Edit booking" }).waitFor();
    await sheet(page)
      .locator('input[name="endsAt"]')
      .fill(`${day(4)}T11:00`);
    await button(page, "Save changes").click();
    await sheet(page).waitFor({ state: "detached" });
    const [saved] = await calls(page, `PUT ${path}/b1`);
    assert.deepEqual(saved.body, {
      systemId: "s1",
      guest: { name: "Guest b1", phone: "+972501234567" },
      startsAt: `${day(1)}T15:00:00.000Z`,
      endsAt: `${day(4)}T11:00:00.000Z`,
      status: "confirmed",
      note: "",
      version: 1,
    });
    assert.ok(saved.key);
    assert.deepEqual(errors, []);
  });

  await t.test(
    "a paused service: bookings stay readable, every booking button disabled with why",
    async () => {
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture("owner", {}, { available: false }),
        { query: "?view=calendar" },
      );
      await loaded(page, "calendar");
      const reason = "Service is unavailable for this organization right now.";
      assert.equal(await page.locator("[data-new-booking]").isDisabled(), true);
      assert.equal(
        await page
          .locator(".calendar-heading .system-action-blocked .info-tip__bubble")
          .textContent(),
        reason,
      );
      assert.equal(await page.locator(".calendar-cell").count(), 0);
      await openBooking(page, "b1");
      for (const action of ["link", "edit", "cancel"]) {
        const element = sheet(page).locator(`[data-booking-${action}]`);
        assert.equal(await element.count(), 1, action);
        assert.equal(await element.isDisabled(), true, action);
      }
      assert.equal(
        await sheet(page)
          .locator(".booking-sheet__actions .info-tip__bubble")
          .textContent(),
        reason,
      );
      await page.keyboard.press("Escape");
      await page
        .locator('#host-section-navigation [data-view-id="bookings"]')
        .click();
      await loaded(page, "bookings");
      assert.equal(await page.locator("[data-new-booking]").isDisabled(), true);
      await page
        .locator('#host-section-navigation [data-view-id="systems"]')
        .click();
      await loaded(page, "systems");
      assert.equal(
        await page
          .locator('[data-system-id="s1"] [data-action="guest-link"]')
          .isDisabled(),
        true,
      );
      assert.equal(
        (await requests(page)).some((entry) => entry.call.startsWith("POST")),
        false,
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a booking with an active link shows it again: one Show link, no new link, then only the link's card",
    async () => {
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture("owner", {
          grants: {
            b1: [
              {
                id: "grant-b1-1",
                reservationId: "b1",
                reservationVersion: 1,
                status: "issued",
                createdAt: "2026-10-14T09:00:00.000Z",
              },
              {
                id: "grant-old",
                reservationId: "b1",
                reservationVersion: 0,
                status: "superseded",
                createdAt: "2026-10-13T09:00:00.000Z",
              },
            ],
          },
        }),
        { query: "?view=calendar" },
      );
      await loaded(page, "calendar");
      await openBooking(page, "b1");
      await sheet(page).locator('[data-grant-id="grant-b1-1"]').waitFor();
      assert.equal(
        await sheet(page).locator("[data-grant-id]").count(),
        1,
        "only the active link is marked",
      );
      // One way to show it: the main button, never a second one in the list.
      const show = sheet(page).locator("[data-booking-link]");
      assert.equal(await show.textContent(), "Show link");
      assert.equal(
        await sheet(page)
          .getByRole("button", { name: "Show link", exact: true })
          .count(),
        1,
      );
      await show.click();
      await sheet(page).locator("[data-guest-link]").waitFor();
      // With the link's card on screen (Copy, WhatsApp, QR), no Show link
      // is left.
      assert.equal(
        await sheet(page)
          .getByRole("button", { name: "Show link", exact: true })
          .count(),
        0,
      );
      assert.equal(
        (
          await calls(
            page,
            "POST /api/v1/organizations/org/access-grants/grant-b1-1/reveal",
          )
        ).length,
        1,
      );
      assert.equal(
        (await calls(page, `POST ${path}/b1/access-grants`)).length,
        0,
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a draft gets its link from its details: confirmed first, then its state and links update",
    async () => {
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture("owner", {
          reservations: {
            org: [
              booking("d1", "s1", "Room 101", day(1), day(3), {
                status: "draft",
              }),
            ],
          },
        }),
        { query: "?view=calendar" },
      );
      await loaded(page, "calendar");
      await openBooking(page, "d1");
      const badge = sheet(page).locator(".booking-facts .booking-status");
      assert.equal(await badge.textContent(), "Draft");
      await sheet(page).locator("[data-booking-link]").click();
      await sheet(page).locator("[data-guest-link]").waitFor();
      const [confirmed] = await calls(page, `PUT ${path}/d1`);
      assert.equal(confirmed.body.status, "confirmed");
      assert.equal(confirmed.body.version, 1);
      const [issued] = await calls(page, `POST ${path}/d1/access-grants`);
      assert.equal(issued.body.reservationVersion, 2);
      assert.equal(await badge.textContent(), "Confirmed");
      await sheet(page).locator('[data-grant-id="grant-d1-2"]').waitFor();
      assert.equal(
        await sheet(page).locator("[data-booking-link]").textContent(),
        "Show link",
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a link too long for a QR code: the button is disabled with why; a long one that fits still gets one",
    async () => {
      for (const [length, fitsQr] of [
        [3500, false],
        [2500, true],
      ]) {
        const { page, errors } = await openWorkspace(
          t,
          site,
          fixture("owner", {
            revealUrl: `https://wifigate.io/wifigate-api/?ep=v1.${"A".repeat(length)}`,
          }),
          { query: "?view=calendar" },
        );
        await loaded(page, "calendar");
        await openBooking(page, "b1");
        await sheet(page).locator("[data-booking-link]").click();
        const card = sheet(page).locator("[data-guest-link]");
        await card.waitFor();
        const qr = card.getByRole("button", { name: "QR code", exact: true });
        if (fitsQr) {
          await qr.click();
          await card.locator(".link-card__qr img").waitFor();
        } else {
          assert.equal(await qr.isDisabled(), true);
          assert.equal(
            await card.locator(".info-tip__bubble").textContent(),
            "This link is too long for a QR code. Use Copy or WhatsApp.",
          );
          assert.equal(
            await card.locator("[data-copy-link]").isEnabled(),
            true,
          );
        }
        assert.deepEqual(errors, []);
      }
    },
  );

  await t.test(
    "early entry and late exit count toward 31 days: refused before anything is saved",
    async () => {
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture("owner", {
          policy: {
            org: {
              id: "organization",
              enabled: true,
              earlyAccessMinutes: 120,
              lateExpiryMinutes: 120,
              channel: "none",
              version: 1,
            },
          },
        }),
        { query: "?view=calendar" },
      );
      await loaded(page, "calendar");
      await newBooking(page);
      // 30 days and 22 hours: under 31 days, over it with the four hours.
      await sheet(page)
        .locator('input[name="startsAt"]')
        .fill(`${day(1)}T14:00`);
      await sheet(page)
        .locator('input[name="endsAt"]')
        .fill(`${day(32)}T12:00`);
      await button(page, "Create guest link").click();
      await status(page)
        .getByText(
          "A guest link can cover up to 31 days, with early entry and late exit. Shorten the stay.",
          { exact: true },
        )
        .waitFor();
      assert.equal((await calls(page, `POST ${path}`)).length, 0);
      assert.equal(
        (await calls(page, "GET /api/v1/organizations/org/automation/policy"))
          .length,
        1,
      );
      assert.equal(
        await sheet(page).locator('input[name="endsAt"]').isEnabled(),
        true,
      );
      // A shorter stay gets its link.
      await sheet(page)
        .locator('input[name="endsAt"]')
        .fill(`${day(31)}T12:00`);
      await button(page, "Create guest link").click();
      await sheet(page).locator("[data-guest-link]").waitFor();
      assert.equal((await calls(page, `POST ${path}`)).length, 1);
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a link refused for good: no Try again, the booking stays without a link",
    async () => {
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture("owner", {
          failures: {
            [`POST ${path}/booking-1/access-grants`]: {
              code: "ACCESS_EXPIRED",
            },
          },
        }),
        { query: "?view=calendar" },
      );
      await loaded(page, "calendar");
      await newBooking(page);
      await button(page, "Create guest link").click();
      await status(page)
        .getByText(
          "This stay has ended, so it can't get a guest link. The booking is saved without a link.",
          { exact: true },
        )
        .waitFor();
      assert.equal(await button(page, "Try again").count(), 0);
      assert.equal(
        await sheet(page).locator("[data-booking-primary]").isHidden(),
        true,
      );
      const close = sheet(page).locator("[data-booking-draft]");
      assert.equal(await close.textContent(), "Close");
      await close.click();
      await sheet(page).waitFor({ state: "detached" });
      await page
        .locator('[data-calendar-system="s2"] [data-booking-id="booking-1"]')
        .waitFor();
      assert.equal((await calls(page, `POST ${path}`)).length, 1);
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a reveal that fails is tried again with the same Idempotency-Key",
    async () => {
      const reveal =
        "POST /api/v1/organizations/org/access-grants/grant-booking-1-1/reveal";
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture("owner", {
          failures: { [reveal]: { code: "SYSTEM_UNAVAILABLE", times: 1 } },
        }),
        { query: "?view=calendar" },
      );
      await loaded(page, "calendar");
      await newBooking(page);
      await button(page, "Create guest link").click();
      await status(page)
        .getByText("This system isn't available right now.", { exact: true })
        .waitFor();
      await button(page, "Try again").click();
      await sheet(page).locator("[data-guest-link]").waitFor();
      const reveals = await calls(page, reveal);
      assert.equal(reveals.length, 2);
      assert.equal(reveals[0].key, reveals[1].key);
      assert.equal((await calls(page, `POST ${path}`)).length, 1);
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "the owner deletes a closed booking's guest details after a fresh sign-in",
    async () => {
      const closed = () =>
        fixture("owner", {
          reservations: {
            org: [
              booking("done", "s1", "Room 101", day(-5), day(-3), {
                status: "completed",
              }),
            ],
          },
          failures: {
            [`POST ${path}/done/privacy/redact`]: {
              status: 403,
              code: "RECENT_AUTH_REQUIRED",
              times: 1,
            },
          },
        });
      const { page, errors } = await openWorkspace(t, site, closed(), {
        query: "?view=bookings",
      });
      await loaded(page, "bookings");
      await page.locator('[data-bookings-tab="past"]').click();
      await openBooking(page, "done");
      const erase = button(page, "Delete guest details");
      assert.equal(await erase.isDisabled(), true);
      await sheet(page)
        .getByLabel("Delete this guest's details for good", { exact: true })
        .check();
      await erase.click();
      await sheet(page).waitFor({ state: "detached" });
      const redacts = await calls(page, `POST ${path}/done/privacy/redact`);
      assert.equal(redacts.length, 2);
      assert.equal(redacts[0].key, redacts[1].key);
      assert.deepEqual(redacts[1].body, {
        version: 1,
        confirm: "delete_guest_details",
      });
      assert.equal(await page.evaluate(() => window.verifications), 1);
      assert.deepEqual(await page.evaluate(() => window.accessErrors), []);
      await page.locator('.booking-row[data-booking-id="done"]').waitFor();
      assert.match(
        await page.locator('.booking-row[data-booking-id="done"]').innerText(),
        /Guest details removed/,
      );
      // An admin never sees it.
      const state = closed();
      state.organizations[0] = organization("org", "Grand Hotel", "admin");
      const admin = await openWorkspace(t, site, state, {
        query: "?view=bookings",
      });
      await loaded(admin.page, "bookings");
      await admin.page.locator('[data-bookings-tab="past"]').click();
      await openBooking(admin.page, "done");
      assert.equal(
        await sheet(admin.page).locator(".booking-privacy").count(),
        0,
      );
      assert.deepEqual(errors, []);
      assert.deepEqual(admin.errors, []);
    },
  );

  await t.test(
    "Bookings finds a phone number written the local way or with its country code",
    async () => {
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture(
          "owner",
          {
            reservations: {
              org: [
                booking("b1", "s1", "Room 101", day(1), day(3)),
                booking("uk", "s2", "Lobby door", day(2), day(4), {
                  guest: { name: "Alex", phone: "+447700900212" },
                }),
              ],
            },
          },
          { timezone: "Asia/Jerusalem" },
        ),
        { query: "?view=bookings" },
      );
      await loaded(page, "bookings");
      await page.locator('[data-bookings-tab="upcoming"]').click();
      const search = page.locator(".bookings-search input");
      const rows = () =>
        page
          .locator(".booking-row")
          .evaluateAll((items) => items.map((item) => item.dataset.bookingId));
      for (const [typed, sent, found] of [
        ["050-123-4567", "501234567", ["b1"]],
        ["+44 7700 900212", "447700900212", ["uk"]],
        ["Alex", "Alex", ["uk"]],
      ]) {
        await search.fill(typed);
        await search.press("Enter");
        await page.waitForFunction(
          (sent) =>
            window.fixture.requests.at(-1)?.query.q === sent &&
            !document.querySelector(".bookings-status")?.textContent,
          sent,
        );
        assert.deepEqual(await rows(), found, typed);
      }
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "Past lists the latest stays first and reads older ones on Show more",
    async () => {
      const past = Array.from({ length: 50 }, (_, index) =>
        booking(
          `p${index + 1}`,
          "s1",
          "Room 101",
          day(-index - 2),
          day(-index - 1),
        ),
      );
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture("owner", { pageSize: 20, reservations: { org: past } }),
        { query: "?view=bookings" },
      );
      await loaded(page, "bookings");
      await page.locator('[data-bookings-tab="past"]').click();
      await page.locator('.booking-row[data-booking-id="p1"]').waitFor();
      const rows = () =>
        page
          .locator(".booking-row")
          .evaluateAll((items) => items.map((item) => item.dataset.bookingId));
      const first = await rows();
      assert.deepEqual(first.slice(0, 3), ["p1", "p2", "p3"]);
      const more = page.getByRole("button", { name: "Show more", exact: true });
      while (await more.isVisible()) {
        const count = (await rows()).length;
        await more.click();
        await page.waitForFunction(
          (count) =>
            document.querySelectorAll(".booking-row").length > count ||
            document.querySelector(".host-bookings > button[hidden]"),
          count,
        );
      }
      const all = await rows();
      // 60 days back: p1 … p59 would fit; the 50 stays all show, in order.
      assert.deepEqual(
        all,
        past.map((record) => record.id),
      );
      // Every read asks for at most 62 days.
      for (const entry of await calls(page, `GET ${path}`))
        assert.ok(
          Date.parse(entry.query.to) - Date.parse(entry.query.from) <=
            62 * 86400000,
        );
      assert.ok(await fits(page));
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "Cancelled reads from next month back, the latest stay first",
    async () => {
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture("owner", {
          reservations: {
            org: [
              booking("later", "s1", "Room 101", day(10), day(12), {
                status: "cancelled",
              }),
              booking("soon", "s2", "Lobby door", day(2), day(3), {
                status: "cancelled",
              }),
              booking("before", "s1", "Room 101", day(-5), day(-4), {
                status: "cancelled",
              }),
              booking("open", "s1", "Room 101", day(4), day(5)),
            ],
          },
        }),
        { query: "?view=bookings" },
      );
      await loaded(page, "bookings");
      await page.locator('[data-bookings-tab="cancelled"]').click();
      await page.locator('.booking-row[data-booking-id="before"]').waitFor();
      assert.deepEqual(
        await page
          .locator(".booking-row")
          .evaluateAll((items) => items.map((item) => item.dataset.bookingId)),
        ["later", "soon", "before"],
      );
      for (const entry of await calls(page, `GET ${path}`))
        if (entry.query.status) assert.equal(entry.query.status, "cancelled");
      assert.deepEqual(errors, []);
    },
  );
});
