import { openSystemAction } from "./lib/host-booking-site.mjs";
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

// Calendar and Bookings against the in-memory Host API: one row per system
// in the organization's time zone, the range and layout that fit the
// space, the one-step booking sheet (booking → access → link), its
// refusals, and what each role may do.
const systems = () => [
  system("s1", "Room 101"),
  system("s2", "Lobby door"),
  system("s3", "Parking", "group"),
];
const fixture = (role = "owner", extra = {}) => ({
  plan: null,
  organizations: [organization("org", "Grand Hotel", role)],
  systems: { org: systems() },
  reservations: {
    org: [
      booking("b1", "s1", "Room 101", day(1), day(3)),
      // Made before systems replaced rooms: no systemId.
      booking("old", null, null, day(2), day(4), {
        targetIds: [],
        roomId: "room",
        propertyId: "property",
        roomName: "Old room",
        systemName: undefined,
      }),
    ],
  },
  ...extra,
});
const calls = async (page, call) =>
  (await requests(page)).filter((entry) => entry.call === call);
const sheet = (page) => page.locator("dialog.booking-sheet[open]");
const reservationsPath = "/api/v1/organizations/org/reservations";

// Fills the booking sheet: a system, the guest and an Israeli mobile number
// written the local way.
async function fillGuest(page, { systemId, name = "Dana Levi" } = {}) {
  const form = sheet(page);
  if (systemId)
    await form.locator('select[name="systemId"]').selectOption(systemId);
  await form.locator('input[name="name"]').fill(name);
  await form.locator('select[name="country"]').selectOption("IL");
  await form.locator('input[name="phone"]').fill("050-123-4567");
}

test("Calendar and Bookings: systems as rows, the booking sheet and guest links", async (t) => {
  const site = await startHostSite(t);

  await t.test(
    "one row per system, older bookings under —, organization time without a property",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture(), {
        query: "?view=calendar",
      });
      await loaded(page, "calendar");
      assert.deepEqual(
        await page
          .locator(".calendar-grid tbody th")
          .evaluateAll((cells) => cells.map((cell) => cell.textContent.trim())),
        ["Lobby door", "Parking", "Room 101", "—"],
      );
      // The shared Manager content column starts with one readable week.
      assert.equal(await page.locator(".calendar-grid thead th").count(), 8);
      assert.equal(
        await page
          .locator('[data-range="week"]')
          .getAttribute("aria-pressed"),
        "true",
      );
      const chip = page.locator(
        '[data-calendar-system="s1"] [data-booking-id="b1"]',
      );
      assert.equal(
        await chip.evaluate((element) => element.style.gridColumn),
        "2 / 5",
      );
      assert.match(
        await chip.getAttribute("aria-label"),
        /Guest b1 · Confirmed · Room 101/,
      );
      assert.equal(
        await page
          .locator('[data-calendar-system=""] [data-booking-id="old"]')
          .count(),
        1,
        "an older booking without a system still shows",
      );
      for (const entry of await calls(
        page,
        `POST ${reservationsPath}/time-zone/resolve`,
      ))
        assert.deepEqual(Object.keys(entry.body).sort(), [
          "disambiguation",
          "localTime",
        ]);
      const [read] = await calls(page, `GET ${reservationsPath}`);
      assert.deepEqual(Object.keys(read.query).sort(), ["from", "limit", "to"]);
      // Filter by system: the API reads that system only.
      await page
        .locator('.calendar-filters select[name="systemId"]')
        .selectOption("s1");
      await page.waitForFunction(() =>
        window.fixture.requests.some((entry) => entry.query.systemId === "s1"),
      );
      await page.waitForFunction(
        () => document.querySelectorAll(".calendar-grid tbody tr").length === 1,
      );
      assert.equal(
        await page.locator(".calendar-grid tbody th").innerText(),
        "Room 101",
      );
      await page.locator('[data-range="week"]').click();
      await page.waitForFunction(
        () => document.querySelectorAll(".calendar-grid thead th").length === 8,
      );
      assert.equal(await page.locator("text=propert").count(), 0);
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "the range and layout follow the space: every day shown is on screen",
    async () => {
      // [width, range, agenda]: two weeks only when they fit, one week on a
      // tablet or a small laptop, an agenda where one week does not fit.
      for (const [width, range, agenda] of [
        [320, "week", true],
        [390, "week", true],
        [600, "week", true],
        [768, "week", false],
        [1024, "week", false],
        [1280, "week", false],
        [1440, "week", false],
      ]) {
        const { page, errors } = await openWorkspace(t, site, fixture(), {
          query: "?view=calendar",
          viewport: { width, height: 800 },
        });
        await loaded(page, "calendar");
        assert.equal(
          await page
            .locator(`[data-range="${range}"]`)
            .getAttribute("aria-pressed"),
          "true",
          `${width}px starts with ${range}`,
        );
        assert.equal(
          await page.locator(".calendar-agenda").count(),
          agenda ? 1 : 0,
          `${width}px agenda`,
        );
        if (agenda)
          assert.ok(
            (await page.locator(".calendar-agenda").innerText()).includes(
              "Guest b1",
            ),
          );
        else
          assert.equal(
            await page.locator(".calendar-grid thead th").count(),
            range === "week" ? 8 : 15,
          );
        assert.equal(
          await page
            .locator(".calendar-scroll")
            .evaluate((grid) => grid.scrollWidth - grid.clientWidth),
          0,
          `${width}px: no day is hidden behind a sideways scroll`,
        );
        assert.ok(await fits(page), `${width}px fits`);
        assert.deepEqual(errors, []);
      }
      // A window made narrower follows: one week, then the agenda; a range
      // the person picked stays.
      const { page, errors } = await openWorkspace(t, site, fixture(), {
        query: "?view=calendar",
      });
      await loaded(page, "calendar");
      await page.setViewportSize({ width: 1000, height: 800 });
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-range="week"]')
            .getAttribute("aria-pressed") === "true" &&
          document.querySelectorAll(".calendar-grid thead th").length === 8,
      );
      await page.setViewportSize({ width: 400, height: 800 });
      await page.locator(".calendar-agenda").waitFor();
      await page.locator('[data-range="month"]').click();
      await page.setViewportSize({ width: 1440, height: 800 });
      await page.locator(".calendar-grid").waitFor();
      assert.equal(
        await page.locator('[data-range="month"]').getAttribute("aria-pressed"),
        "true",
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "Create guest link: one booking, its access and its link, then the link card",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture(), {
        query: "?view=calendar",
      });
      await loaded(page, "calendar");
      await page.locator("[data-new-booking]").click();
      await sheet(page).waitFor();
      assert.equal(
        await sheet(page).locator('input[name="startsAt"]').inputValue(),
        `${day(0)}T15:00`,
      );
      assert.equal(
        await sheet(page).locator('input[name="endsAt"]').inputValue(),
        `${day(1)}T12:00`,
      );
      await fillGuest(page, { systemId: "s2" });
      await sheet(page)
        .getByRole("button", { name: "Create guest link", exact: true })
        .click();
      const card = sheet(page).locator("[data-guest-link]");
      await card.waitFor();
      const [created] = await calls(page, `POST ${reservationsPath}`);
      assert.deepEqual(created.body, {
        systemId: "s2",
        guest: { name: "Dana Levi", phone: "+972501234567" },
        startsAt: `${day(0)}T15:00:00.000Z`,
        endsAt: `${day(1)}T12:00:00.000Z`,
        status: "confirmed",
        note: "",
      });
      assert.ok(created.key, "the booking carries an Idempotency-Key");
      const [issued] = await calls(
        page,
        `POST ${reservationsPath}/booking-1/access-grants`,
      );
      assert.deepEqual(issued.body, { reservationVersion: 1 });
      assert.ok(issued.key);
      const [revealed] = await calls(
        page,
        "POST /api/v1/organizations/org/access-grants/grant-booking-1-1/reveal",
      );
      assert.deepEqual(revealed.body, {});
      assert.ok(revealed.key);
      const order = (await requests(page))
        .map((entry) => entry.call)
        .filter(
          (call) => call.startsWith("POST") && !call.endsWith("/resolve"),
        );
      assert.deepEqual(order, [
        `POST ${reservationsPath}`,
        `POST ${reservationsPath}/booking-1/access-grants`,
        "POST /api/v1/organizations/org/access-grants/grant-booking-1-1/reveal",
      ]);
      const url =
        "https://wifigate.io/wifigate-api/?ep=v1.fixture_grant-booking-1-1";
      assert.equal(await card.locator(".link-card__url").innerText(), url);
      const whatsapp = await card
        .locator("[data-whatsapp]")
        .getAttribute("href");
      assert.ok(whatsapp.startsWith("https://wa.me/972501234567?text="));
      assert.ok(decodeURIComponent(whatsapp).includes(url));
      await card.getByRole("button", { name: "QR code", exact: true }).click();
      await card.locator(".link-card__qr img").waitFor();
      assert.equal(
        await sheet(page)
          .locator("p.visually-hidden[aria-live]")
          .last()
          .textContent(),
        "The guest link is ready.",
      );
      assert.equal(
        await sheet(page).locator(".booking-sheet__status").textContent(),
        "",
      );
      await sheet(page)
        .getByRole("button", { name: "Done", exact: true })
        .click();
      await page
        .locator('[data-calendar-system="s2"] [data-booking-id="booking-1"]')
        .waitFor();
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "an overlap is refused in the sheet and nothing else is sent",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture(), {
        query: "?view=calendar",
      });
      await loaded(page, "calendar");
      // An empty day of Room 101 opens the sheet with that system and day.
      await page
        .locator(`[data-calendar-system="s1"] [data-calendar-cell="${day(6)}"]`)
        .click();
      await sheet(page).waitFor();
      assert.equal(
        await sheet(page).locator('select[name="systemId"]').inputValue(),
        "s1",
      );
      assert.equal(
        await sheet(page).locator('input[name="startsAt"]').inputValue(),
        `${day(6)}T15:00`,
      );
      await fillGuest(page);
      await sheet(page)
        .locator('input[name="startsAt"]')
        .fill(`${day(2)}T15:00`);
      await sheet(page)
        .locator('input[name="endsAt"]')
        .fill(`${day(3)}T10:00`);
      await sheet(page)
        .getByRole("button", { name: "Create guest link", exact: true })
        .click();
      await sheet(page)
        .locator(".booking-sheet__status")
        .getByText("This system is already booked for these times.", {
          exact: true,
        })
        .waitFor();
      assert.equal(
        (await requests(page)).some((entry) =>
          entry.call.includes("access-grants"),
        ),
        false,
      );
      assert.equal(
        await sheet(page).locator('input[name="name"]').isEnabled(),
        true,
      );
      assert.equal(
        await sheet(page).locator('input[name="name"]').inputValue(),
        "Dana Levi",
      );
      assert.deepEqual(await page.evaluate(() => window.accessErrors), []);
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a gate that needs the app: the booking stays and Try again retries only the link",
    async () => {
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture("owner", {
          failures: {
            [`POST ${reservationsPath}/booking-1/access-grants`]: {
              code: "GATE_DELEGATION_REQUIRED",
              times: 1,
            },
          },
        }),
        { query: "?view=calendar" },
      );
      await loaded(page, "calendar");
      await page.locator("[data-new-booking]").click();
      await fillGuest(page, { systemId: "s3" });
      await sheet(page)
        .getByRole("button", { name: "Create guest link", exact: true })
        .click();
      await sheet(page)
        .getByText("Open the WIFIGATE app near this gate and add it again.", {
          exact: true,
        })
        .waitFor();
      assert.equal(
        await sheet(page).locator('input[name="name"]').isDisabled(),
        true,
      );
      await sheet(page)
        .getByRole("button", { name: "Try again", exact: true })
        .click();
      await sheet(page).locator("[data-guest-link]").waitFor();
      assert.equal((await calls(page, `POST ${reservationsPath}`)).length, 1);
      const issues = await calls(
        page,
        `POST ${reservationsPath}/booking-1/access-grants`,
      );
      assert.equal(issues.length, 2);
      assert.equal(
        issues[0].key,
        issues[1].key,
        "one intent, one Idempotency-Key",
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "Save without link keeps a draft and closes the sheet",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture(), {
        query: "?view=calendar",
      });
      await loaded(page, "calendar");
      await page.locator("[data-new-booking]").click();
      await fillGuest(page, { systemId: "s3", name: "Draft guest" });
      await sheet(page)
        .getByRole("button", { name: "Save without link", exact: true })
        .click();
      await sheet(page).waitFor({ state: "detached" });
      const [created] = await calls(page, `POST ${reservationsPath}`);
      assert.equal(created.body.status, "draft");
      await page
        .locator(
          '[data-calendar-system="s3"] .reservation-draft[data-booking-id="booking-1"]',
        )
        .waitFor();
      assert.equal(
        (await requests(page)).some((entry) =>
          entry.call.includes("access-grants"),
        ),
        false,
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a booking's details: its link, then cancelling it with its version",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture(), {
        query: "?view=calendar",
      });
      await loaded(page, "calendar");
      await page.locator('[data-booking-id="b1"]').click();
      await sheet(page).getByRole("heading", { name: "Guest b1" }).waitFor();
      await sheet(page).locator("[data-booking-link]").click();
      await sheet(page).locator("[data-guest-link]").waitFor();
      assert.equal(
        (await calls(page, `POST ${reservationsPath}/b1/access-grants`))[0].body
          .reservationVersion,
        1,
      );
      await sheet(page).locator("[data-booking-cancel]").click();
      const confirm = page.locator("dialog.system-dialog[open]");
      await confirm
        .getByRole("button", { name: "Cancel booking", exact: true })
        .click();
      await sheet(page).waitFor({ state: "detached" });
      const [cancelled] = await calls(page, `PUT ${reservationsPath}/b1`);
      assert.equal(cancelled.body.status, "cancelled");
      assert.equal(cancelled.body.version, 1);
      assert.equal(cancelled.body.systemId, "s1");
      await page
        .locator('[data-booking-id="b1"].reservation-cancelled')
        .waitFor();
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "an older booking that holds several systems: no Edit or link, and Cancel closes it on a system it holds",
    async () => {
      const state = fixture();
      state.reservations.org.push(
        booking("multi", null, null, day(5), day(6), {
          targetIds: ["s1", "s2"],
          roomId: "room",
          propertyId: "property",
          systemName: undefined,
        }),
      );
      const { page, errors } = await openWorkspace(t, site, state, {
        query: "?view=calendar",
      });
      await loaded(page, "calendar");
      await page
        .locator('[data-calendar-system=""] [data-booking-id="multi"]')
        .click();
      await sheet(page).getByRole("heading", { name: "Guest multi" }).waitFor();
      assert.equal(
        await sheet(page).locator(".booking-facts__system").innerText(),
        "—",
      );
      assert.equal(
        await sheet(page)
          .locator("[data-booking-link], [data-booking-edit]")
          .count(),
        0,
        "no single system to change it with or link it to",
      );
      await sheet(page).locator("[data-booking-cancel]").click();
      await page
        .locator("dialog.system-dialog[open]")
        .getByRole("button", { name: "Cancel booking", exact: true })
        .click();
      await sheet(page).waitFor({ state: "detached" });
      const [cancelled] = await calls(page, `PUT ${reservationsPath}/multi`);
      assert.equal(cancelled.body.status, "cancelled");
      assert.equal(cancelled.body.version, 1);
      assert.equal(
        cancelled.body.systemId,
        "s1",
        "the first system the booking holds",
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test("a viewer reads: no booking buttons anywhere", async () => {
    const { page, errors } = await openWorkspace(t, site, fixture("viewer"), {
      query: "?view=calendar",
    });
    await loaded(page, "calendar");
    assert.equal(await page.locator("[data-new-booking]").count(), 0);
    assert.equal(await page.locator(".calendar-cell").count(), 0);
    await page.locator('[data-booking-id="b1"]').click();
    await sheet(page).waitFor();
    for (const action of ["link", "edit", "cancel"])
      assert.equal(
        await sheet(page).locator(`[data-booking-${action}]`).count(),
        0,
        action,
      );
    await page.keyboard.press("Escape");
    await page
      .locator('#host-section-navigation [data-view-id="bookings"]')
      .click();
    await loaded(page, "bookings");
    assert.equal(await page.locator("[data-new-booking]").count(), 0);
    await page
      .locator('#host-section-navigation [data-view-id="systems"]')
      .click();
    await loaded(page, "systems");
    assert.equal(await page.locator('[data-action="guest-link"]').count(), 0);
    assert.equal(
      (await requests(page)).some(
        (entry) =>
          entry.call.startsWith("POST") && !entry.call.endsWith("/resolve"),
      ),
      false,
    );
    assert.deepEqual(errors, []);
  });

  await t.test(
    "staff book from a system card and never see Connect",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture("staff"));
      await loaded(page, "systems");
      assert.equal(
        await page
          .locator('#host-section-navigation [data-view-id="connect"]')
          .isVisible(),
        false,
      );
      assert.equal(
        await page
          .locator('#host-section-navigation [data-view-id="activity"]')
          .isVisible(),
        true,
      );
      await openSystemAction(page, "s2", "guest-link");
      await page
        .locator('[data-system-id="s2"] [data-action="guest-link"]')
        .click();
      await sheet(page).waitFor();
      assert.equal(
        await sheet(page).locator('select[name="systemId"]').inputValue(),
        "s2",
      );
      await fillGuest(page);
      await sheet(page)
        .getByRole("button", { name: "Create guest link", exact: true })
        .click();
      await sheet(page).locator("[data-guest-link]").waitFor();
      assert.equal(
        (await calls(page, `POST ${reservationsPath}`))[0].body.systemId,
        "s2",
      );
      await sheet(page)
        .getByRole("button", { name: "Done", exact: true })
        .click();
      await page
        .locator('#host-section-navigation [data-view-id="calendar"]')
        .click();
      await page
        .locator('[data-calendar-system="s2"] [data-booking-id="booking-1"]')
        .waitFor();
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "Bookings: tabs, search and an older booking without a system",
    async () => {
      const state = fixture("owner");
      state.reservations.org.push(
        booking("now", "s2", "Lobby door", day(0), day(1), {
          startsAt: new Date(Date.now() - 3600000).toISOString(),
        }),
        booking("before", "s3", "Parking", day(-6), day(-4)),
        booking("gone", "s1", "Room 101", day(3), day(5), {
          status: "cancelled",
        }),
      );
      const { page, errors } = await openWorkspace(t, site, state, {
        query: "?view=reservations",
      });
      await loaded(page, "bookings");
      assert.equal(new URL(page.url()).searchParams.get("view"), "bookings");
      const rows = () =>
        page
          .locator(".booking-row")
          .evaluateAll((items) => items.map((item) => item.dataset.bookingId));
      assert.deepEqual(await rows(), ["now"]);
      await page.locator('[data-bookings-tab="upcoming"]').click();
      await page.waitForFunction(() =>
        document.querySelector('.booking-row[data-booking-id="old"]'),
      );
      assert.deepEqual(await rows(), ["b1", "old"]);
      assert.equal(
        await page
          .locator('.booking-row[data-booking-id="old"] .booking-row__system')
          .innerText(),
        "—",
      );
      await page.locator('[data-bookings-tab="past"]').click();
      await page.waitForFunction(() =>
        document.querySelector('.booking-row[data-booking-id="before"]'),
      );
      assert.deepEqual(await rows(), ["before"]);
      await page.locator('[data-bookings-tab="cancelled"]').click();
      await page.waitForFunction(() =>
        document.querySelector('.booking-row[data-booking-id="gone"]'),
      );
      assert.equal((await requests(page)).at(-1).query.status, "cancelled");
      await page.locator('[data-bookings-tab="upcoming"]').click();
      await page.locator(".bookings-search input").fill("old");
      await page.locator(".bookings-search input").press("Enter");
      await page.waitForFunction(() =>
        window.fixture.requests.some((entry) => entry.query.q === "old"),
      );
      await page.waitForFunction(
        () => document.querySelectorAll(".booking-row").length === 1,
      );
      await page.locator('.booking-row[data-booking-id="old"]').click();
      await sheet(page)
        .locator(".booking-facts__system")
        .getByText("—")
        .waitFor();
      assert.equal(
        await sheet(page)
          .locator("[data-booking-link], [data-booking-edit]")
          .count(),
        0,
        "a booking without any system offers nothing to change",
      );
      await page.keyboard.press("Escape");
      for (const width of [390, 320]) {
        await page.setViewportSize({ width, height: 800 });
        assert.ok(await fits(page), `${width}px`);
      }
      assert.deepEqual(errors, []);
    },
  );
  await t.test(
    "the range's edges are worked out in the page, without asking the server",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture(), {
        query: "?view=calendar",
      });
      await loaded(page, "calendar");
      assert.equal(
        (await calls(page, `POST ${reservationsPath}/time-zone/resolve`))
          .length,
        0,
      );
      const [read] = await calls(page, `GET ${reservationsPath}`);
      assert.equal(read.query.from, `${day(0)}T00:00:00.000Z`);
      assert.equal(read.query.to, `${day(7)}T00:00:00.000Z`);
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "the agenda says a booking's state in words, not only in colour",
    async () => {
      const state = fixture();
      state.reservations.org.push(
        booking("gone", "s2", "Lobby door", day(1), day(2), {
          status: "cancelled",
        }),
        booking("maybe", "s3", "Parking", day(1), day(2), { status: "draft" }),
      );
      const { page, errors } = await openWorkspace(t, site, state, {
        query: "?view=calendar",
        viewport: { width: 390, height: 800 },
      });
      await loaded(page, "calendar");
      const item = (id) =>
        page.locator(`.calendar-agenda [data-booking-id="${id}"]`).first();
      assert.match(await item("gone").innerText(), /Cancelled/);
      assert.match(await item("maybe").innerText(), /Draft/);
      assert.doesNotMatch(await item("b1").innerText(), /Confirmed/);
      assert.ok(await fits(page));
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "an older booking with one active system sits in its row, filtered or not",
    async () => {
      const state = fixture();
      state.reservations.org.push(
        booking("single", null, null, day(4), day(5), {
          targetIds: ["s1"],
          roomId: "room",
          propertyId: "property",
          systemName: undefined,
        }),
      );
      const { page, errors } = await openWorkspace(t, site, state, {
        query: "?view=calendar",
      });
      await loaded(page, "calendar");
      await page
        .locator('[data-calendar-system="s1"] [data-booking-id="single"]')
        .waitFor();
      await page
        .locator('.calendar-filters select[name="systemId"]')
        .selectOption("s1");
      await page.waitForFunction(() =>
        window.fixture.requests.some((entry) => entry.query.systemId === "s1"),
      );
      await page.waitForFunction(
        () => document.querySelectorAll(".calendar-grid tbody tr").length === 1,
      );
      assert.deepEqual(
        await page
          .locator(".calendar-grid tbody th")
          .evaluateAll((cells) => cells.map((cell) => cell.textContent.trim())),
        ["Room 101"],
        "no — row while one system is chosen",
      );
      await page
        .locator('[data-calendar-system="s1"] [data-booking-id="single"]')
        .click();
      assert.equal(
        await sheet(page).locator(".booking-facts__system").innerText(),
        "Room 101",
      );
      await page.keyboard.press("Escape");
      // The agenda shows the same bookings for the same filter.
      await page.setViewportSize({ width: 390, height: 800 });
      await page.locator(".calendar-agenda").waitFor();
      // Arrival day and departure day.
      assert.equal(
        await page
          .locator('.calendar-agenda [data-booking-id="single"]')
          .count(),
        2,
      );
      assert.equal(
        await page.locator('.calendar-agenda [data-booking-id="old"]').count(),
        0,
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "no active systems: one sentence, and bookings of removed systems still show",
    async () => {
      const state = fixture();
      state.systems.org = [];
      state.reservations.org = [
        booking("kept", "removed", "Old gate", day(1), day(2)),
      ];
      const { page, errors } = await openWorkspace(t, site, state, {
        query: "?view=calendar",
      });
      await loaded(page, "calendar");
      await page.locator('[data-booking-id="kept"]').waitFor();
      assert.equal(
        await page.locator(".host-calendar .empty-state__text").innerText(),
        "Add a system from the WIFIGATE app to start taking bookings.",
      );
      assert.deepEqual(
        await page
          .locator(".calendar-grid tbody th")
          .evaluateAll((cells) => cells.map((cell) => cell.textContent.trim())),
        ["Old gate"],
      );
      assert.equal(await page.locator("[data-new-booking]").count(), 0);
      // Nothing at all: only the sentence and its action.
      const empty = fixture();
      empty.systems.org = [];
      empty.reservations.org = [];
      const second = await openWorkspace(t, site, empty, {
        query: "?view=calendar",
      });
      await loaded(second.page, "calendar");
      assert.equal(
        await second.page.locator(".calendar-toolbar").isVisible(),
        false,
      );
      assert.equal(
        await second.page.locator(".calendar-scroll").isVisible(),
        false,
      );
      assert.equal(
        await second.page.locator(".host-calendar .empty-state").isVisible(),
        true,
      );
      // Bookings: the same single sentence, no "No bookings here." beside it.
      await second.page
        .locator('#host-section-navigation [data-view-id="bookings"]')
        .click();
      await loaded(second.page, "bookings");
      await second.page.waitForFunction(
        () => !document.querySelector(".bookings-status")?.textContent,
      );
      const text = await second.page.locator(".host-bookings").innerText();
      assert.match(text, /Add a system from the WIFIGATE app/);
      assert.doesNotMatch(text, /No bookings here/);
      assert.deepEqual(errors, []);
      assert.deepEqual(second.errors, []);
    },
  );

  await t.test(
    "a tall row (a long system name) keeps its day lines and empty days to the bottom",
    async () => {
      const state = fixture();
      state.systems.org[0].name =
        "Parking garage entrance with a very long name that wraps";
      const { page, errors } = await openWorkspace(t, site, state, {
        query: "?view=calendar",
      });
      await loaded(page, "calendar");
      const sizes = await page
        .locator('[data-calendar-system="s1"]')
        .evaluate((row) => ({
          cell: row.querySelector("td").getBoundingClientRect().height,
          timeline: row
            .querySelector(".calendar-timeline")
            .getBoundingClientRect().height,
          day: row.querySelector(".calendar-cell").getBoundingClientRect()
            .height,
        }));
      assert.ok(sizes.cell > 64, "the name wraps");
      assert.ok(
        Math.abs(sizes.cell - sizes.timeline) <= 2,
        JSON.stringify(sizes),
      );
      assert.ok(Math.abs(sizes.cell - sizes.day) <= 2, JSON.stringify(sizes));
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "days before today offer no new booking; a past stay gets no link",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture(), {
        query: "?view=calendar",
      });
      await loaded(page, "calendar");
      const days = await page
        .locator('[data-calendar-system="s1"] [data-calendar-cell]')
        .evaluateAll((cells) => cells.map((cell) => cell.dataset.calendarCell));
      assert.equal(days[0], day(0));
      await page.getByRole("button", { name: "Previous", exact: true }).click();
      await page.waitForFunction(
        () =>
          document.querySelector("th[data-calendar-date]")?.dataset
            .calendarDate !== undefined &&
          !document.querySelector(".calendar-today"),
      );
      assert.equal(await page.locator("[data-calendar-cell]").count(), 0);
      // "+ Booking" with a stay that already ended: refused before a write.
      await page.locator("[data-new-booking]").click();
      await fillGuest(page, { systemId: "s2" });
      await sheet(page)
        .locator('input[name="startsAt"]')
        .fill(`${day(-3)}T15:00`);
      await sheet(page)
        .locator('input[name="endsAt"]')
        .fill(`${day(-1)}T12:00`);
      await sheet(page)
        .getByRole("button", { name: "Create guest link", exact: true })
        .click();
      await sheet(page)
        .locator(".booking-sheet__status")
        .getByText(
          "This stay has already ended. Choose a later time to leave.",
          {
            exact: true,
          },
        )
        .waitFor();
      assert.equal((await calls(page, `POST ${reservationsPath}`)).length, 0);
      assert.equal(
        await sheet(page).locator('input[name="endsAt"]').isEnabled(),
        true,
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a name in the other script starts where the page starts",
    async () => {
      const state = fixture();
      state.reservations.org[0].guest.name = "Jonathan Smith";
      const { page, errors } = await openWorkspace(t, site, state, {
        query: "?view=calendar&lang=he",
        real: true,
      });
      await loaded(page, "calendar");
      const name = page.locator('[data-booking-id="b1"] strong').first();
      assert.equal(await name.getAttribute("dir"), null);
      assert.equal(await name.locator("bdi").innerText(), "Jonathan Smith");
      assert.equal(
        await name.evaluate((element) => getComputedStyle(element).direction),
        "rtl",
      );
      await page.locator('[data-booking-id="b1"]').first().click();
      const heading = sheet(page).locator("h2");
      assert.equal(await heading.getAttribute("dir"), null);
      assert.equal(await heading.locator("bdi").innerText(), "Jonathan Smith");
      assert.deepEqual(errors, []);
    },
  );
});
