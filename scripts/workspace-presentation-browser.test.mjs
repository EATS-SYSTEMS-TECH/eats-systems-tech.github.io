import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  startHostSite,
  openWorkspace,
  organization,
  system,
  booking,
  day,
  loaded,
} from "./lib/host-booking-site.mjs";

const evidence = process.env.WIFIGATE_WORKSPACE_SCREENSHOTS;

async function openProduct(t, site, product, language, width) {
  if (product === "host") {
    const fixture = await openWorkspace(
      t,
      site,
      {
        plan: "user",
        organizations: [organization("org", "Seaside Hotel", "owner")],
        systems: {
          org: [
            system("room-101", "Room 101"),
            { ...system("room-102", "Room 102"), calendarEnabled: false },
          ],
        },
        reservations: {
          org: [
            booking("stay", "room-101", "Room 101", day(1), day(3)),
            booking("hidden-stay", "room-102", "Room 102", day(1), day(3)),
          ],
        },
      },
      {
        real: true,
        query: `?org=org&view=calendar&lang=${language}`,
        viewport: { width, height: 1000 },
      },
    );
    await loaded(fixture.page, "calendar");
    return fixture;
  }

  const context = await site.browser.newContext({
    viewport: { width, height: 1000 },
  });
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const html = (
    await readFile(
      new URL(`../dashboard/${product}/index.html`, import.meta.url),
      "utf8",
    )
  ).replace(/<script[\s\S]*?<\/script>/g, "");
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== site.origin) return route.abort();
    if (url.pathname === `/dashboard/${product}/`)
      return route.fulfill({ contentType: "text/html", body: html });
    return route.continue();
  });
  await page.goto(`${site.origin}/dashboard/${product}/`);
  await page.evaluate(
    async ({ product, language }) => {
      document.documentElement.lang = language;
      document.documentElement.dir = language === "he" ? "rtl" : "ltr";
      for (const node of document.querySelectorAll(
        ".platform-heading,#platform-status,#platform-retry,#product-grid,#platform-security,#product-title",
      ))
        node.hidden = true;
      document.querySelector("#product-workspace").hidden = false;
      window.WebSocket = class {
        constructor() {
          throw new Error("No physical connections in presentation tests");
        }
      };
      const items = ["gate", "dual-control", "group"].map((type, index) => ({
        id: String(index + 1).repeat(64),
        type,
        name:
          language === "he"
            ? ["שער החניון", "כניסה ויציאה", "מתחם המלון"][index]
            : ["Car park gate", "Entry and exit", "Hotel grounds"][index],
        targetId: "fixture-gate",
        systemIds: ["fixture-gate"],
        status: "active",
        version: 1,
        permissions: {
          canConfigure: true,
          canAssignOrganization: true,
          canRemove: true,
        },
        organization: null,
        linkedOrganization: null,
        capabilities: {
          paymentModes: ["single-entry"],
          paymentsEnabled: false,
          physicalOpening: false,
        },
        config: {
          currency: "ILS",
          priceMinor: 1200,
          accessMode: "single-entry",
          enabled: false,
        },
      }));
      const profile = {
        user: { uid: "fixture-user" },
        role: "user",
        personalRole: "user",
        account: { id: "fixture-account" },
        canManageSystems: true,
        uploadEnabled: true,
        paymentsEnabled: false,
        organizations: [
          {
            id: "org",
            name: language === "he" ? "מלון חוף הים" : "Seaside Hotel",
            role: "owner",
          },
        ],
      };
      const module = await import(`/js/${product}-dashboard.js`);
      const create =
        product === "pay"
          ? module.createPayDashboard
          : module.createManagerDashboard;
      window.dashboard = create({
        root: document.querySelector(`#${product}-root`),
        user: profile.user,
        language,
        api: async (route, method = "GET") => {
          if (method !== "GET")
            throw new Error("Presentation tests never mutate records");
          if (route.endsWith("/me")) return profile;
          if (route.includes("/systems?"))
            return { items, nextCursor: null, paymentsEnabled: false };
          return { items: [], nextCursor: null, paymentsEnabled: false };
        },
      });
      await window.dashboard.ready;
    },
    { product, language },
  );
  await page
    .locator(".manager-view > .manager-grid .manager-system")
    .first()
    .waitFor();
  return { page, errors };
}

async function contrast(locator) {
  return locator.evaluate((node) => {
    const parse = (color) => color.match(/[\d.]+/g).map(Number);
    const style = getComputedStyle(node);
    let background = parse(style.backgroundColor);
    for (
      let parent = node.parentElement;
      background[3] === 0 && parent;
      parent = parent.parentElement
    ) {
      background = parse(getComputedStyle(parent).backgroundColor);
    }
    const luminance = (channels) =>
      channels
        .slice(0, 3)
        .map((value) => {
          value /= 255;
          return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
        })
        .reduce(
          (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
          0,
        );
    const foreground = luminance(parse(style.color)),
      behind = luminance(background);
    return (
      (Math.max(foreground, behind) + 0.05) /
      (Math.min(foreground, behind) + 0.05)
    );
  });
}

test("operating workspaces remain readable and keyboard accessible in both directions", async (t) => {
  const site = await startHostSite(t);
  if (evidence) await mkdir(evidence, { recursive: true });
  for (const product of ["host", "pay", "manager"]) {
    for (const language of ["he", "en"]) {
      for (const width of [320, 390, 1440]) {
        await t.test(`${product} ${language} ${width}`, async (t) => {
          const { page, errors } = await openProduct(
            t,
            site,
            product,
            language,
            width,
          );
          await page.evaluate(() => document.fonts.ready);
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            "page does not scroll sideways",
          );
          const navigation = page.locator(".manager-nav");
          const current = navigation
            .locator('button[aria-current="page"]')
            .first();
          const other = navigation
            .locator("button.manager-button:not([aria-current])")
            .first();
          assert.ok(
            (await contrast(current)) >= 4.5,
            "current destination is readable",
          );
          assert.ok(
            (await contrast(other)) >= 4.5,
            "other destinations are readable",
          );
          await other.focus();
          assert.notEqual(
            await other.evaluate((node) => getComputedStyle(node).outlineStyle),
            "none",
            "keyboard destination has visible focus",
          );
          const trigger = navigation.locator(
            ".manager-organization-picker-trigger",
          );
          await trigger.focus();
          await page.keyboard.press("Enter");
          const panel = page.locator(
            ".manager-organization-picker-panel:visible",
          );
          await panel.waitFor();
          const bounds = await panel.boundingBox();
          assert.ok(
            bounds.x >= -1 && bounds.x + bounds.width <= width + 1,
            "organization picker fits the viewport",
          );
          await page.keyboard.press("Escape");
          assert.equal(
            await trigger.evaluate((node) => node === document.activeElement),
            true,
            "picker returns keyboard focus",
          );
          assert.deepEqual(errors, []);
          if (evidence)
            await page.screenshot({
              path: path.join(evidence, `${product}-${language}-${width}.png`),
              fullPage: true,
            });
        });
      }
    }
  }
});
