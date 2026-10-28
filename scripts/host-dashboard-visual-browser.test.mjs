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
} from "./lib/host-booking-site.mjs";

// What the visual review of the Host dashboard (scripts/host-dashboard-
// screens.mjs) found and fixed, kept fixed: the product pill at the centre
// of the screen at every width, no ring around a whole screen, collapsed
// parts that read as such, ⓘ beside labels, plain words instead of codes and
// ids, Hebrew time zones in Hebrew, refusals that stop asking and whose way
// forward is the main button, no Change on the signed-in owner's own row.
const fixture = (role = "owner", extra = {}) => ({
  plan: "user",
  organizations: [
    organization("org", "Seaside Hotel", role, { timezone: "Asia/Jerusalem" }),
  ],
  systems: { org: [system("s1", "Room 101"), system("s2", "Lobby door")] },
  reservations: {
    org: [booking("b1", "s1", "Room 101", day(1), day(3))],
  },
  members: {
    org: [
      {
        id: "m1",
        email: "owner@example.test",
        role: "owner",
        status: "active",
      },
    ],
  },
  invitations: {
    org: [
      {
        id: "invitation-1",
        email: "night@example.test",
        role: "staff",
        status: "pending",
        version: 1,
        expiresAt: "2026-10-21T09:00:00.000Z",
      },
    ],
  },
  ...extra,
});
const box = (page, selector) =>
  page
    .locator(selector)
    .first()
    .evaluate((element) => {
      const { left, right, top, bottom, width, height } =
        element.getBoundingClientRect();
      return { left, right, top, bottom, width, height };
    });

test("the Host dashboard keeps the fixes from its visual review", async (t) => {
  const site = await startHostSite(t);

  await t.test(
    "the product pill sits at the centre of the window at every width beside the sidebar, as on Pay and Manager",
    async () => {
      for (const width of [1440, 1279, 1100, 960]) {
        const centre = width / 2;
        const { page, errors } = await openWorkspace(t, site, fixture(), {
          real: true,
          viewport: { width, height: 900 },
        });
        await loaded(page, "my-systems");
        const pill = await box(page, "#product-switcher");
        assert.ok(
          Math.abs((pill.left + pill.right) / 2 - centre) <= 2,
          `${width}px: pill centre ${(pill.left + pill.right) / 2}, expected ${centre}`,
        );
        const bar = await box(page, ".host-topbar");
        assert.ok(bar.left >= -1 && bar.right <= width + 1, `${width}px bar`);
        // The shared header uses the product picker as its visible title.
        // Host keeps the view title available to assistive technology only.
        assert.equal(
          await page.locator(".host-topbar__title").evaluate(
            (element) => getComputedStyle(element).clipPath,
          ),
          "inset(50%)",
        );
        // The keyboard follows the screen: the sidebar (its brand at the
        // top start) before the bar's controls, the phone's tab bar after
        // the footer links, and a role chip is never a stop.
        assert.deepEqual(
          await page.evaluate(() => {
            const after = (a, b) =>
              Boolean(
                document
                  .querySelector(a)
                  .compareDocumentPosition(document.querySelector(b)) &
                Node.DOCUMENT_POSITION_FOLLOWING,
              );
            return [
              after(".host-topbar", "#host-sidebar"),
              after("#host-sidebar", "#workspace-main"),
              [...document.querySelectorAll(".host-role-badge")].filter(
                (chip) => chip.tabIndex >= 0,
              ).length,
            ];
          }),
          [true, true, 0],
        );
        // A pending account has no sidebar: the bar keeps to the window.
        await page.evaluate(() =>
          document.body.classList.add("host-menu-empty"),
        );
        const pending = await box(page, ".host-topbar");
        assert.ok(pending.left >= -1 && pending.right <= width + 1);
        assert.deepEqual(errors, []);
      }
    },
  );

  await t.test(
    "a screen that takes focus after a view change has no ring; a control reached by keyboard has one",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture(), {
        query: "?view=connect",
      });
      await loaded(page, "connect");
      const ring = (selector) =>
        page
          .locator(selector)
          .first()
          .evaluate((element) => {
            element.focus();
            return getComputedStyle(element).outlineStyle;
          });
      await page.evaluate(() => {
        const panel = document.querySelector('[data-workspace-view="connect"]');
        panel.tabIndex = -1;
      });
      assert.equal(await ring('[data-workspace-view="connect"]'), "none");
      // The keyboard moves on to the first button of the screen.
      for (let step = 0; step < 40; step++) {
        await page.keyboard.press("Tab");
        if (
          await page.evaluate(
            () =>
              document.activeElement?.tagName === "BUTTON" &&
              !document.activeElement.classList.contains("info-tip__button"),
          )
        )
          break;
      }
      const focused = await page.evaluate(() => [
        document.activeElement.tagName,
        getComputedStyle(document.activeElement).outlineStyle,
      ]);
      assert.equal(focused[0], "BUTTON");
      assert.notEqual(focused[1], "none");
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "Connect: collapsed parts read as such, the booking system's ⓘ sits beside its label, keys fold under For your developer",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture(), {
        query: "?view=connect",
      });
      await loaded(page, "connect");
      const summaries = await page
        .locator('[data-workspace-view="connect"] details > summary')
        .evaluateAll((items) =>
          items.map((item) => ({
            height: item.getBoundingClientRect().height,
            chevron: getComputedStyle(item, "::after").content,
            marker: getComputedStyle(item).listStyleType,
          })),
        );
      assert.ok(summaries.length >= 2);
      for (const summary of summaries) {
        assert.ok(summary.height >= 44, `summary ${summary.height}px`);
        assert.notEqual(summary.chevron, "none");
        assert.equal(summary.marker, "none");
      }
      const rooms = page.getByRole("region", { name: "Your booking system" });
      // The booking system's own name and its rooms are for a developer:
      // closed until "For your developer" opens.
      assert.equal(
        await rooms.locator('input[name="provider"]').isVisible(),
        false,
      );
      await rooms.locator("details.connect-setup > summary").click();
      const caption = rooms.locator("label .field-caption");
      assert.equal(await caption.locator(".info-tip").count(), 1);
      const tip = await box(
        page,
        '[aria-label="Your booking system"] .field-caption .info-tip',
      );
      const input = await box(
        page,
        '[aria-label="Your booking system"] input[name="provider"]',
      );
      assert.ok(
        tip.bottom <= input.top + 1,
        "the ⓘ is on the label's line, above the field",
      );
      assert.equal(
        await rooms
          .getByText("No bookings from it yet.", { exact: true })
          .isVisible(),
        true,
      );
      const keys = page.getByRole("region", { name: "Your own software" });
      assert.equal(
        await keys.locator("h2").innerText(),
        "Your own software",
        "the card is named for what it connects, not as API keys",
      );
      assert.equal(
        await keys.locator("details.connect-keys > summary").innerText(),
        "For your developer",
      );
      assert.equal(await keys.getByLabel("API key name").isVisible(), false);
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "Team: the role choice explains itself in an ⓘ, a request to join is a row with a plain status and a secondary Cancel",
    async () => {
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture("owner", {
          email: "Owner@Example.test",
          members: {
            org: [
              {
                id: "m1",
                email: "owner@example.test",
                role: "owner",
                status: "active",
              },
              {
                id: "m2",
                email: "front@example.test",
                role: "staff",
                status: "active",
              },
            ],
          },
        }),
        { query: "?view=settings&tab=team" },
      );
      const team = page.locator('[data-settings-panel="team"]');
      const row = team.locator('[data-invitation-id="invitation-1"]');
      await row.waitFor();
      // The signed-in owner's own row: no Change, an ⓘ that says who can.
      const own = team.locator('[data-member-email="owner@example.test"]');
      assert.equal(
        await own.getByRole("button", { name: /Change/ }).count(),
        0,
      );
      assert.equal(
        await own.locator(".info-tip__bubble").textContent(),
        "Another owner can change your role or access.",
      );
      assert.equal(
        await team
          .locator('[data-member-email="front@example.test"]')
          .getByRole("button", {
            name: "Change front@example.test",
            exact: true,
          })
          .count(),
        1,
      );
      const form = team.locator(
        'section[aria-label="Invite team members"] form',
      );
      assert.equal(
        await form.locator(".host-role-badge").count(),
        0,
        "no chip repeats the select",
      );
      assert.deepEqual(
        await form.locator('select[name="role"] option').allTextContents(),
        ["Staff", "Viewer", "Admin", "Owner"],
        "role names, never their ids",
      );
      assert.equal(
        await form.locator("label .field-caption .info-tip").count(),
        1,
      );
      assert.match(
        await form
          .locator("label .field-caption .info-tip__bubble")
          .textContent(),
        /bookings, guest links/,
      );
      assert.match(await row.innerText(), /Invitation pending · open until/);
      assert.doesNotMatch(await row.innerText(), /UTC/);
      assert.equal(
        await row
          .getByRole("button", { name: "Cancel team invitation", exact: true })
          .getAttribute("class"),
        "button-secondary",
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "Settings in Hebrew name the time zone in Hebrew; Plan & statements explain in ⓘ, not paragraphs",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture(), {
        query: "?view=settings&tab=organization&lang=he",
        real: true,
      });
      const zone = page.locator(
        '[data-settings-panel="organization"] select[name="timezone"]',
      );
      await zone.waitFor();
      const label = await zone.evaluate(
        (select) => select.selectedOptions[0].textContent,
      );
      assert.equal(label, "שעון ישראל");
      await page.locator('[role="tab"][data-settings-tab="billing"]').click();
      const billing = page.locator('[data-settings-panel="billing"]');
      await billing.locator(".settings-block").first().waitFor();
      const blocks = await billing.locator(".settings-block").count();
      assert.equal(blocks, 3);
      assert.equal(
        await billing
          .locator(".settings-block > .view-heading .info-tip")
          .count(),
        3,
      );
      assert.equal(
        await billing.evaluate(
          (panel) =>
            [...panel.querySelectorAll("p")].filter(
              (p) => p.textContent.length > 80 && p.offsetParent,
            ).length,
        ),
        0,
        "no hint paragraph",
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "Activity speaks in words: alert events and channels have names, codes fold under For your developer",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture(), {
        query: "?view=activity&section=review",
      });
      const review = page.locator('[data-operations-screen="review"]');
      await review.locator("details").first().waitFor();
      assert.equal(
        await page.locator('[aria-label="Operations workspace"] h2').count(),
        0,
      );
      await review.locator("summary", { hasText: "Your preferences" }).click();
      // Alert events are checkboxes, one per event, never a list box.
      assert.equal(
        await review.locator('select[name="eventTypes"]').count(),
        0,
      );
      const events = await review
        .locator('input[type="checkbox"][name="eventTypes"]')
        .evaluateAll((boxes) =>
          boxes.map((box) => box.closest("label").textContent.trim()),
        );
      assert.equal(events.length, 12);
      for (const event of events) assert.doesNotMatch(event, /[._]/, event);
      assert.ok(events.includes("An automatic guest link failed"));
      for (const name of [
        "Alerts in the dashboard",
        "Alerts by email",
        "Alerts by SMS",
      ])
        assert.equal(
          await review.getByLabel(name, { exact: true }).count(),
          1,
          name,
        );
      // A message template explains its placeholders in an ⓘ; its code
      // name is made for it, never typed.
      await review.locator("summary", { hasText: "Message templates" }).click();
      const templates = review.locator("details", {
        has: page.locator("summary", { hasText: "Message templates" }),
      });
      assert.equal(
        await templates.locator("label .field-caption .info-tip").count(),
        1,
      );
      assert.equal(
        await templates.evaluate(
          (group) =>
            [...group.querySelectorAll("p")].filter(
              (p) => p.textContent.includes("{{guestName}}") && p.offsetParent,
            ).length,
        ),
        0,
        "no placeholder hint paragraph",
      );
      assert.equal(await templates.locator('input[name="id"]').count(), 0);
      // Alerts: one sentence and one action.
      const alerts = review.locator("details", {
        has: page.locator("summary", { hasText: "Operational alerts" }),
      });
      await alerts.locator("summary").click();
      assert.deepEqual(await alerts.locator(":scope > p").allTextContents(), [
        "Alerts about automatic guest links and your booking system show here.",
      ]);
      assert.equal(
        await alerts
          .getByRole("button", { name: "Show alerts", exact: true })
          .count(),
        1,
      );
      const developer = review.locator("details.operations-developer");
      assert.equal(
        await developer.locator(":scope > summary").innerText(),
        "For your developer",
      );
      assert.deepEqual(
        await developer.locator(":scope > details > summary").allTextContents(),
        [
          "Operational observations",
          "System configuration",
          "Saved calendar filters",
          "Staff notification delivery",
          "API creation usage",
        ],
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a removal refused for bookings makes Open bookings the main button beside Close",
    async () => {
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture("owner", {
          failures: {
            "POST /api/v1/organizations/org/systems/s1/remove": {
              status: 409,
              code: "SYSTEM_HAS_BOOKINGS",
              details: { count: 2 },
            },
          },
        }),
        { query: "?view=systems" },
      );
      await loaded(page, "systems");
      await openSystemAction(page, "s1", "remove");
      await page
        .locator(
          '[data-workspace-view="systems"] [data-system-id="s1"] [data-action="remove"]',
        )
        .click();
      const dialog = page.locator("dialog.system-dialog[open]");
      await dialog.locator('button[type="submit"]').click();
      const open = dialog.locator(
        ".system-dialog__actions > [data-open-bookings]",
      );
      await open.waitFor();
      // The dialog stops asking: its title says it can't be done yet and
      // the question's explanation is gone.
      assert.equal(
        await dialog.getByRole("heading").textContent(),
        "Can't remove Room 101 yet",
      );
      assert.equal(await dialog.locator(".system-dialog__text").count(), 0);
      assert.equal(
        await dialog.getAttribute("aria-describedby"),
        await dialog.locator(".system-dialog__status").getAttribute("id"),
      );
      assert.deepEqual(
        await dialog
          .locator(".system-dialog__actions > button")
          .evaluateAll((buttons) =>
            buttons.map((button) => [button.textContent, button.className]),
          ),
        [
          ["Open bookings", "manager-button primary"],
          ["Close", "manager-button button-secondary"],
        ],
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "on a Hebrew phone: dates stay whole, the search hint fits, the country picker shows its code, a cancelled stay reads only Cancelled",
    async () => {
      const phone = { width: 390, height: 844 };
      const state = fixture("owner", {
        reservations: {
          org: [
            booking("b1", "s1", "Room 101", day(1), day(3)),
            booking("c1", "s2", "Lobby door", day(1), day(4), {
              status: "cancelled",
            }),
          ],
        },
      });
      // Lines a part takes (its height over its line height).
      const oneLine = (locator) =>
        locator.evaluateAll((parts) =>
          parts.map((part) =>
            Math.round(
              part.getBoundingClientRect().height /
                parseFloat(getComputedStyle(part).lineHeight),
            ),
          ),
        );
      // Calendar (the phone agenda).
      let { page, errors } = await openWorkspace(t, site, state, {
        query: "?view=calendar&lang=he",
        real: true,
        viewport: phone,
      });
      await loaded(page, "calendar");
      await page.locator(".calendar-agenda").waitFor();
      assert.deepEqual(
        await oneLine(page.locator(".calendar-heading__date")),
        [1, 1],
      );
      const cancelled = page.locator('.calendar-agenda [data-booking-id="c1"]');
      assert.equal(await cancelled.count(), 1, "a cancelled stay shows once");
      assert.equal(await cancelled.locator(".agenda-item__time").count(), 0);
      assert.equal(
        await cancelled.locator(".booking-status--cancelled").textContent(),
        "בוטלה",
      );
      assert.ok(
        (await page
          .locator('.calendar-agenda [data-booking-id="b1"]')
          .count()) > 1,
        "a confirmed stay shows on each of its days",
      );
      // The booking sheet: the country picker shows its code, whole.
      await page.locator("[data-new-booking]").first().click();
      const sheet = page.locator("dialog.booking-sheet[open]");
      await sheet.waitFor();
      const picker = sheet.locator(".phone-field__picker");
      assert.equal(
        await picker.locator(".phone-field__code").textContent(),
        "+972",
      );
      assert.ok(
        await picker.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
      );
      await sheet.locator('select[name="country"]').selectOption("GB");
      assert.equal(
        await picker.locator(".phone-field__code").textContent(),
        "+44",
      );
      assert.deepEqual(errors, []);
      // Bookings: the search hint fits its field.
      ({ page, errors } = await openWorkspace(t, site, state, {
        query: "?view=bookings&lang=he",
        real: true,
        viewport: phone,
      }));
      await loaded(page, "bookings");
      const [text, room] = await page
        .locator(".bookings-search input")
        .evaluate((input) => {
          const style = getComputedStyle(input);
          const context = document.createElement("canvas").getContext("2d");
          context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          return [
            context.measureText(input.placeholder).width,
            input.clientWidth -
              parseFloat(style.paddingLeft) -
              parseFloat(style.paddingRight),
          ];
        });
      assert.ok(text <= room, `placeholder ${text}px in ${room}px`);
      assert.deepEqual(errors, []);
      // Team: when joining closes stays on one line.
      ({ page, errors } = await openWorkspace(t, site, state, {
        query: "?view=settings&tab=team&lang=he",
        real: true,
        viewport: phone,
      }));
      await page.locator('[data-invitation-id="invitation-1"]').waitFor();
      assert.deepEqual(
        await oneLine(page.locator(".team-invitation__date")),
        [1],
      );
      assert.match(
        await page.locator(".team-invitation__state").textContent(),
        /^ממתין להצטרפות · פתוח עד /,
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test("Platform names products, never their ids", async () => {
    const { page, errors } = await openWorkspace(t, site, fixture());
    await loaded(page, "my-systems");
    assert.deepEqual(
      await page.evaluate(async () => {
        const { productName } = await import("/js/host-admin-overview.js");
        return ["host", "pay", "manager"].map(productName);
      }),
      ["Host", "Pay", "Manager"],
    );
    assert.deepEqual(errors, []);
  });
});

test("the product picker speaks Hebrew in its labels and keeps 44px header controls on a phone", async (t) => {
  const { startSite, scenario } = await import("./platform-test-fixtures.mjs");
  const { origin, browser } = await startSite(t);
  const fixture = await scenario(browser, {
    mobile: true,
    enrolled: true,
    verified: true,
  });
  t.after(() => fixture.context.close());
  const { page, errors } = fixture;
  await page.goto(origin + "/dashboard/?lang=he");
  await page.locator("#product-grid:not([hidden]) > *").first().waitFor();
  assert.equal(
    await page.locator(".platform-header .brand").getAttribute("aria-label"),
    "דף הבית של הדשבורד",
  );
  assert.equal(
    await page.locator(".security-steps").getAttribute("aria-label"),
    "הגדרת אפליקציית האימות",
  );
  // Product names keep Latin order within the Hebrew card layout.
  for (const tile of await page.locator(".product-tile").all()) {
    assert.equal(await tile.locator("h2 bdi").getAttribute("dir"), "ltr");
    assert.equal(await tile.locator("h2 bdi").evaluate(
      (element) => getComputedStyle(element).textAlign,
    ), "right");
  }
  for (const selector of [
    ".platform-header .brand",
    "#platform-language",
    ".dashboard-profile-button",
  ]) {
    const { height } = await box(page, selector);
    assert.ok(height >= 44, `${selector} ${height}px`);
  }
  assert.deepEqual(errors, []);
});
