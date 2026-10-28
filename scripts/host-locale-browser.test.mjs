import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
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

// The URL decides the Host language (never the browser): Hebrew is right to
// left, every label is translated, names people gave (organizations,
// systems, guests) stay as they are, and every screen fits 1440, 390 and
// 320 pixels without sideways scrolling.
const copy = {
  he: {
    calendar: "לוח שנה",
    sheet: ["מערכת", "שם האורח", "טלפון", "הגעה", "עזיבה"],
    more: "פרטים נוספים",
    create: "יצירת קישור לאורח",
    draft: "שמירה בלי קישור",
    confirmed: "מאושרת",
    tabs: ["היום", "הבאות", "שעברו", "שבוטלו"],
    activity: ["קישורים אוטומטיים", "התרעות ופעילות", "בריאות השירות"],
    zone: "אזור זמן",
    account: "ניהול אבטחת החשבון",
    removed: "פרטי האורח נמחקו",
    overlap: "המערכת הזו כבר מוזמנת בזמנים האלה.",
    other: "English",
  },
  en: {
    calendar: "Calendar",
    sheet: ["System", "Guest name", "Phone", "Arrives", "Leaves"],
    more: "More details",
    create: "Create guest link",
    draft: "Save without link",
    confirmed: "Confirmed",
    tabs: ["Today", "Upcoming", "Past", "Cancelled"],
    activity: ["Automatic links", "Alerts and activity", "Service health"],
    zone: "Time zone",
    account: "Manage sign-in and security",
    removed: "Guest details removed",
    overlap: "This system is already booked for these times.",
    other: "עברית",
  },
};
// Names that are also interface words: they must never be translated.
const fixture = (language) => ({
  plan: "user",
  locale: language === "he" ? "en-US" : "he-IL",
  organizations: [
    organization("fixture-org", "Calendar", "owner", {
      timezone: "Asia/Jerusalem",
    }),
    organization("fixture-org-2", "Second organization", "owner"),
  ],
  systems: {
    "fixture-org": [system("s1", "Bookings"), system("s2", "Room 212 🥂")],
    "fixture-org-2": [system("t1", "Gate")],
  },
  reservations: {
    "fixture-org": [
      booking("stay", "s1", "Bookings", day(1), day(3), {
        guest: { name: "Staff", phone: "+972501234567" },
      }),
      booking("closed", "s2", "Room 212 🥂", day(2), day(4), {
        guest: { name: "", phone: "" },
        guestRedactedAt: "2026-10-10T12:00:00.000Z",
        status: "cancelled",
      }),
    ],
  },
});
const viewports = [1440, 390, 320];
const shots = process.env.WIFIGATE_SCREENSHOT_DIR;

test("the URL's language sets direction, labels and layout while names stay as people wrote them", async (t) => {
  const site = await startHostSite(t);
  for (const language of ["he", "en"]) {
    const words = copy[language];
    const lang = language === "he" ? "&lang=he" : "";
    const { page, errors } = await openWorkspace(t, site, fixture(language), {
      query: `?view=calendar${lang}`,
      real: true,
    });
    await loaded(page, "calendar");
    assert.equal(await page.locator("html").getAttribute("lang"), language);
    assert.equal(
      await page.locator("html").getAttribute("dir"),
      language === "he" ? "rtl" : "ltr",
    );
    assert.equal(
      await page
        .locator('#host-section-navigation [data-view-id="calendar"]')
        .innerText(),
      words.calendar,
    );
    assert.equal(
      await page.locator("#workspace-current-view").innerText(),
      words.calendar,
    );
    assert.equal(
      await page.locator("#workspace-org-switcher .manager-organization-picker-identity strong").innerText(),
      "Calendar",
      "an organization name is never translated",
    );
    assert.deepEqual(
      await page
        .locator(".calendar-grid tbody th")
        .evaluateAll((cells) => cells.map((cell) => cell.textContent.trim())),
      ["Bookings", "Room 212 🥂"],
      "system names are never translated",
    );
    const chip = page.locator('[data-booking-id="stay"]');
    assert.equal(await chip.locator("strong").innerText(), "Staff");
    const label = await chip.getAttribute("aria-label");
    for (const part of ["Staff", words.confirmed, "Bookings"])
      assert.ok(label.includes(part), `${language} chip label has ${part}`);
    assert.doesNotMatch(label, /\d{4}-\d{2}-\d{2}T/);
    assert.equal(await chip.getAttribute("title"), label);
    // A deleted guest reads as such, in this language.
    assert.equal(
      await page.locator('[data-booking-id="closed"] strong').innerText(),
      words.removed,
    );
    // The booking sheet: its labels, its buttons in reach at every width.
    await page.locator("[data-new-booking]").click();
    const sheet = page.locator("dialog.booking-sheet[open]");
    await sheet.waitFor();
    assert.deepEqual(
      await sheet
        .locator(
          ".booking-form > label, .booking-form .phone-field__label, .booking-form__times label",
        )
        .evaluateAll((labels) =>
          labels.map((label) =>
            (
              label.querySelector(":scope > .field-caption")?.firstChild ??
              label.firstChild
            ).textContent.trim(),
          ),
        ),
      words.sheet,
    );
    // The time zone's ⓘ sits on the Arrives label's line, not on a row of
    // its own between the two times.
    const arrives = sheet.locator(
      '.booking-form__times label:has(input[name="startsAt"])',
    );
    assert.equal(await arrives.locator(".field-caption .info-tip").count(), 1);
    assert.equal(
      await sheet.locator(".booking-form__times > .info-tip").count(),
      0,
    );
    assert.equal(
      await sheet.locator(".booking-form__more summary").innerText(),
      words.more,
    );
    assert.deepEqual(
      await sheet.locator(".booking-sheet__actions button").allInnerTexts(),
      [words.create, words.draft],
    );
    for (const width of viewports) {
      await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
      await sheet.locator(".booking-form__more").evaluate((element) => {
        element.open = true;
      });
      for (const end of [false, true]) {
        await sheet.locator(".booking-sheet__body").evaluate((element, end) => {
          element.scrollTop = end ? element.scrollHeight : 0;
        }, end);
        const geometry = await sheet.evaluate((dialog) => {
          const actions = dialog.querySelector(".booking-sheet__actions");
          const body = dialog.querySelector(".booking-sheet__body");
          return {
            viewport: innerHeight,
            width: innerWidth,
            sheet: dialog.getBoundingClientRect().width,
            top: actions.getBoundingClientRect().top,
            bottom: actions.getBoundingClientRect().bottom,
            body: body.getBoundingClientRect().bottom,
            buttons: [...actions.querySelectorAll("button")].map(
              (button) => button.getBoundingClientRect().height,
            ),
          };
        });
        assert.ok(
          geometry.bottom <= geometry.viewport + 1,
          `${language} ${width} actions in view`,
        );
        assert.ok(
          geometry.body <= geometry.top + 1,
          `${language} ${width} fields never cover the actions`,
        );
        assert.ok(
          geometry.buttons.every((height) => height >= 44),
          `${language} ${width} 44px buttons`,
        );
        assert.ok(
          geometry.sheet <= geometry.width + 1,
          `${language} ${width} sheet width`,
        );
      }
      assert.ok(await fits(page), `${language} sheet fits ${width}px`);
      if (shots) {
        await mkdir(shots, { recursive: true });
        await page.screenshot({
          path: path.join(shots, `host-${language}-sheet-${width}.png`),
        });
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    // An overlap is said in this language.
    await sheet.locator('select[name="systemId"]').selectOption("s1");
    await sheet.locator('input[name="name"]').fill("Overlap");
    await sheet.locator('select[name="country"]').selectOption("IL");
    await sheet.locator('input[name="phone"]').fill("0501234567");
    await sheet.locator('input[name="startsAt"]').fill(`${day(2)}T15:00`);
    await sheet.locator('input[name="endsAt"]').fill(`${day(2)}T18:00`);
    await sheet
      .getByRole("button", { name: words.create, exact: true })
      .click();
    await sheet.getByText(words.overlap, { exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await sheet.waitFor({ state: "detached" });
    // Bookings.
    await page
      .locator('#host-section-navigation [data-view-id="bookings"]')
      .click();
    await loaded(page, "bookings");
    assert.deepEqual(
      await page.locator("[data-bookings-tab]").allInnerTexts(),
      words.tabs,
    );
    await page.locator('[data-bookings-tab="upcoming"]').click();
    await page.locator('.booking-row[data-booking-id="stay"]').waitFor();
    assert.equal(
      await page
        .locator('.booking-row[data-booking-id="stay"] .booking-status')
        .innerText(),
      words.confirmed,
    );
    assert.doesNotMatch(
      await page.locator(".booking-list").innerText(),
      /\d{4}-\d{2}-\d{2}T/,
    );
    // Activity: three screens.
    await page
      .locator('#host-section-navigation [data-view-id="activity"]')
      .click();
    await page
      .locator('[data-operations-screen="jobs"][data-loaded="true"]')
      .waitFor();
    assert.deepEqual(
      await page
        .locator('[data-workspace-view="activity"] .workspace-tabs button')
        .allInnerTexts(),
      words.activity,
    );
    // Every screen fits.
    for (const [view, tab] of [
      ["systems"],
      ["my-systems"],
      ["calendar"],
      ["bookings"],
      ["activity"],
      ["connect"],
      ["settings", "organization"],
      ["settings", "team"],
      ["settings", "billing"],
      ["settings", "support"],
      ["settings", "account"],
    ]) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page
        .locator(`#host-section-navigation [data-view-id="${view}"]`)
        .click();
      if (tab) {
        await page.locator(`[role="tab"][data-settings-tab="${tab}"]`).click();
        await page
          .locator(`[data-settings-panel="${tab}"][data-loaded="true"]`)
          .waitFor();
      } else await loaded(page, view);
      if (tab === "organization")
        assert.equal(
          await page
            .locator(
              '[data-settings-panel="organization"] select[name="timezone"]',
            )
            .getAttribute("aria-label"),
          words.zone,
        );
      if (tab === "account")
        assert.ok(
          (
            await page.locator('[data-settings-panel="account"]').innerText()
          ).includes(words.account),
        );
      for (const width of viewports) {
        await page.setViewportSize({ width, height: 900 });
        assert.ok(
          await fits(page),
          `${language} ${view} ${tab ?? ""} fits ${width}px`,
        );
        if (shots && width !== 320)
          await page.screenshot({
            path: path.join(
              shots,
              `host-${language}-${view}${tab ? "-" + tab : ""}-${width}.png`,
            ),
            fullPage: true,
          });
      }
    }
    // The language button keeps the screen and the organization.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page
      .locator('#host-section-navigation [data-view-id="bookings"]')
      .click();
    await loaded(page, "bookings");
    await page.locator("#workspace-org-switcher .manager-organization-picker-trigger").click();
    await page
      .locator('.manager-organization-picker-options [data-organization-id="fixture-org-2"]')
      .click();
    await page.waitForFunction(
      () =>
        document.querySelector("#host-management").dataset.organizationId ===
          "fixture-org-2" &&
        document.querySelector("#host-management").dataset.loading === "false",
    );
    await page
      .locator('#host-section-navigation [data-view-id="bookings"]')
      .click();
    assert.equal(await page.locator("#host-language").innerText(), "");
    await page.locator("#host-language").click();
    await page.locator("#platform-language-options").getByText(words.other, {exact: true}).click();
    await page.waitForURL((url) =>
      language === "he"
        ? !url.searchParams.has("lang")
        : url.searchParams.get("lang") === "he",
    );
    await page.waitForFunction(() => window.workspaceStarted);
    await loaded(page, "bookings");
    assert.equal(new URL(page.url()).searchParams.get("view"), "bookings");
    assert.equal(
      await page
        .locator("#workspace-org-switcher .manager-organization-picker-trigger")
        .getAttribute("data-organization-id"),
      "fixture-org-2",
    );
    assert.equal(
      await page.locator("html").getAttribute("dir"),
      language === "he" ? "ltr" : "rtl",
    );
    // A URL never authorizes another organization.
    const foreign = new URL(page.url());
    foreign.searchParams.set("org", "foreign-organization");
    await page.goto(foreign.href);
    await page.waitForFunction(() => window.workspaceStarted);
    await loaded(page, "bookings");
    assert.equal(new URL(page.url()).searchParams.get("org"), "fixture-org");
    assert.equal(
      (await requests(page)).some((entry) =>
        entry.call.includes("foreign-organization"),
      ),
      false,
    );
    assert.deepEqual(errors, []);
  }
});
