// WIFIGATE Reservations: the customer page for any signed-in account and the
// WIFIGATE Admin page, against the mocked Firebase and API of the dashboard
// browser tests.
import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { startSite, scenario } from "./platform-test-fixtures.mjs";

const photoJpeg = await sharp({create:{width:96,height:96,channels:3,background:"#eaf1ff"}}).jpeg().toBuffer();

const noPlans = { host: "no-plan", pay: "no-plan", manager: "no-plan" };

function reservation(overrides = {}) {
  return {
    id: "R7K3M9Q2DXH4",
    status: "new",
    version: 1,
    items: [{ productLine: "wifigate", quantity: 2 }],
    contact: { fullName: "דנה כהן", phone: "+972501234567", company: null },
    email: "fixture@example.test",
    address: { country: "IL", city: "חיפה", street: "הרצל 5", postalCode: null },
    notes: "שער צפוני",
    language: "he",
    photoCount: 0,
    customerNote: null,
    trackingNumber: null,
    history: [{ status: "new", at: "2026-10-27T10:00:00.000Z", by: "customer" }],
    cancellable: true,
    createdAt: "2026-10-27T10:00:00.000Z",
    updatedAt: "2026-10-27T10:00:00.000Z",
    ...overrides,
  };
}

async function noHorizontalScroll(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
}

test("an account without any plan signs in, reserves with a photo, follows and cancels in Hebrew", async (t) => {
  const { origin, browser } = await startSite(t);
  const { page, context } = await scenario(browser, {
    signedIn: false,
    mobile: true,
    ...noPlans,
  });
  t.after(() => context.close());

  const requests = [];
  let stored = [];
  await context.route("**/api/v1/product-reservations**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push({
      method: request.method(),
      path: url.pathname,
      body: request.postDataJSON(),
      key: request.headers()["idempotency-key"],
      appCheck: request.headers()["x-firebase-appcheck"],
    });
    if (request.method() === "GET") return route.fulfill({ json: { items: stored } });
    if (url.pathname.endsWith("/cancel")) {
      stored = [
        reservation({
          status: "cancelled",
          version: 2,
          cancellable: false,
          history: [
            ...stored[0].history,
            { status: "cancelled", at: "2026-10-27T11:00:00.000Z", by: "customer" },
          ],
        }),
      ];
      return route.fulfill({ json: { reservation: stored[0] } });
    }
    const body = request.postDataJSON();
    stored = [reservation({ items: body.items, photoCount: body.photos.length, contact: body.contact })];
    return route.fulfill({ status: 201, json: { reservation: stored[0] } });
  });
  await context.route("**/api/v1/product-reservations/*/photos/*", (route) =>
    route.fulfill({ contentType: "image/jpeg", body: photoJpeg }),
  );

  await page.goto(origin + "/reservations/?lang=he");
  await page.getByRole("heading", { name: "הזמנת מערכות" }).waitFor();
  assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
  await page.locator("#reservations-sign-in").waitFor();
  assert.equal(await page.locator(".reservations-catalog .reservation-product").count(), 2);
  assert.equal(await page.locator(".reservation-quantity").count(), 0, "no quantities before sign-in");
  assert.ok(await noHorizontalScroll(page));

  await page.getByRole("button", { name: "המשך עם Google" }).click();
  await page.locator("#reservations-workspace").waitFor();
  assert.equal(
    requests.filter((entry) => entry.path.startsWith("/api/v1/platform")).length,
    0,
    "the page never asks for a product plan",
  );
  assert.equal(await page.locator("input[name=email]").inputValue(), "fixture@example.test");

  // Sending without a product says so before any request.
  await page.getByRole("button", { name: "שליחת ההזמנה" }).click();
  await page.getByText("בחרו לפחות מערכת אחת.").waitFor();

  await page.getByRole("button", { name: "עוד: WIFIGATE", exact: true }).click();
  await page.getByRole("button", { name: "עוד: WIFIGATE", exact: true }).click();
  await page.getByRole("button", { name: "עוד: WIFIGATE Roller shutter" }).click();
  assert.equal(await page.locator("#reservation-summary-total").textContent(), "סה״כ 3 מערכות");

  await page.locator("input[name=fullName]").fill("דנה כהן");
  await page.locator("input[name=phone]").fill("050-123 4567");
  await page.locator("input[name=city]").fill("חיפה");
  await page.locator("input[name=street]").fill("הרצל 5");
  await page.locator("textarea[name=notes]").fill("שער צפוני");
  const png = await sharp({
    create: { width: 2400, height: 1800, channels: 3, background: "#3366cc" },
  })
    .png()
    .toBuffer();
  await page.locator("#reservation-photos-input").setInputFiles({
    name: "gate.png",
    mimeType: "image/png",
    buffer: png,
  });
  await page.locator(".reservation-photo img").waitFor();

  await page.getByRole("button", { name: "שליחת ההזמנה" }).click();
  await page.locator("#reservation-sent").waitFor();
  await page.getByText("מספר ההזמנה R7K3M9Q2DXH4", { exact: false }).waitFor();

  const created = requests.find((entry) => entry.method === "POST" && entry.path === "/api/v1/product-reservations");
  assert.match(created.key, /^[A-Za-z0-9_-]{16,128}$/);
  assert.ok(created.appCheck);
  assert.deepEqual(created.body.items, [
    { productLine: "wifigate", quantity: 2 },
    { productLine: "wifigate-roller-shutter", quantity: 1 },
  ]);
  assert.deepEqual(created.body.contact, { fullName: "דנה כהן", phone: "+972501234567", company: null });
  assert.deepEqual(created.body.address, { country: "IL", city: "חיפה", street: "הרצל 5", postalCode: null });
  assert.equal(created.body.language, "he");
  assert.equal("email" in created.body, false);
  assert.equal(created.body.photos.length, 1);
  const photo = Buffer.from(created.body.photos[0].data, "base64");
  assert.deepEqual([...photo.subarray(0, 3)], [0xff, 0xd8, 0xff]);
  assert.ok(photo.length <= 500 * 1024);
  const meta = await sharp(photo).metadata();
  assert.ok(Math.max(meta.width, meta.height) <= 1600);

  await page.getByRole("button", { name: "להזמנות שלי" }).click();
  const card = page.locator(".reservation-card");
  await card.waitFor();
  await card.locator(".reservation-pill", { hasText: "התקבלה" }).waitFor();
  assert.equal(await card.locator(".reservation-timeline li").count(), 5);
  assert.ok(await noHorizontalScroll(page));

  await card.getByRole("button", { name: "ביטול ההזמנה" }).click();
  await card.getByRole("button", { name: "כן, לבטל" }).click();
  await page.locator(".reservation-card .reservation-pill", { hasText: "בוטלה" }).waitFor();
  const cancel = requests.find((entry) => entry.path.endsWith("/cancel"));
  assert.deepEqual(cancel.body, { version: 1 });
  assert.equal(await page.getByRole("button", { name: "ביטול ההזמנה" }).count(), 0);
});

test("the open-reservations limit and a lost response keep the same Idempotency-Key", async (t) => {
  const { origin, browser } = await startSite(t);
  const { page, context } = await scenario(browser, noPlans);
  t.after(() => context.close());
  const keys = [];
  let attempt = 0;
  await context.route("**/api/v1/product-reservations**", (route) => {
    const request = route.request();
    if (request.method() === "GET") return route.fulfill({ json: { items: [] } });
    keys.push(request.headers()["idempotency-key"]);
    attempt++;
    if (attempt === 1) return route.abort("connectionreset");
    return route.fulfill({
      status: 409,
      json: { error: { code: "OPEN_RESERVATIONS_LIMIT", details: { limit: 5 } } },
    });
  });

  await page.goto(origin + "/reservations/");
  await page.locator("#reservations-workspace").waitFor();
  await page.getByRole("button", { name: "More: WIFIGATE Roller shutter" }).click();
  await page.locator("input[name=fullName]").fill("Dana Cohen");
  await page.locator("input[name=phone]").fill("+44 20 7946 0958");
  await page.locator("input[name=city]").fill("London");
  await page.locator("input[name=street]").fill("1 High Street");
  await page.getByRole("button", { name: "Send reservation" }).click();
  await page.getByText("We can't reach the server").waitFor();
  await page.getByRole("button", { name: "Send reservation" }).click();
  await page.getByText("You already have 5 open reservations").waitFor();
  assert.equal(keys.length, 2);
  assert.equal(keys[0], keys[1]);

  // A number without a country code outside Israel is refused locally.
  await page.locator("#reservation-country").selectOption("GB");
  await page.locator("input[name=phone]").fill("020 7946 0958");
  await page.getByRole("button", { name: "Send reservation" }).click();
  await page.getByText("Enter a phone number with the country code").waitFor();
  assert.equal(await page.locator("input[name=phone]").getAttribute("aria-invalid"), "true");
  assert.equal(keys.length, 2);
});

test("WIFIGATE Admin opens Reservations from the separate admin tools and moves one", async (t) => {
  const { origin, browser } = await startSite(t);
  const { page, context } = await scenario(browser, {
    platformRole: "admin",
    admin: true,
    enrolled: true,
    verified: true,
    manager: "active",
    pay: "active",
  });
  t.after(() => context.close());
  await context.route("**/api/v1/platform/directory?*", (route) =>
    route.fulfill({
      json: { counts: { admins: 1, users: 0, total: 1 }, productCounts: { host: 1, pay: 0, manager: 0 }, items: [], nextCursor: null },
    }),
  );

  const counts = { new: 2, contacted: 1, confirmed: 0, shipped: 1, delivered: 4, cancelled: 1 };
  const posted = [];
  let current = reservation({
    ownerUid: "customer-uid",
    adminNote: null,
    erased: false,
    photoCount: 1,
    nextStatuses: ["contacted", "confirmed", "cancelled"],
    history: [{ status: "new", at: "2026-10-27T10:00:00.000Z", by: "customer", actorEmail: null }],
  });
  let adminRequests = 0;
  await context.route("**/api/v1/product-reservations/admin**", async (route) => {
    adminRequests++;
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/v1/product-reservations/admin")
      return route.fulfill({
        json: {
          counts,
          items: [
            {
              id: current.id,
              status: current.status,
              items: current.items,
              fullName: current.contact.fullName,
              email: current.email,
              country: "IL",
              city: "חיפה",
              photoCount: 1,
              createdAt: current.createdAt,
              updatedAt: current.updatedAt,
            },
          ],
          nextCursor: null,
          truncated: false,
        },
      });
    if (url.pathname.includes("/photos/"))
      return route.fulfill({ contentType: "image/jpeg", body: photoJpeg });
    if (request.method() === "POST") {
      const body = request.postDataJSON();
      posted.push(body);
      current = {
        ...current,
        status: body.status,
        version: current.version + 1,
        customerNote: body.customerNote,
        adminNote: body.adminNote,
        nextStatuses: ["confirmed", "cancelled"],
        history: [...current.history, { status: body.status, at: "2026-10-27T12:00:00.000Z", by: "admin", actorEmail: "fixture@example.test" }],
      };
      return route.fulfill({ json: { reservation: current } });
    }
    return route.fulfill({ json: { reservation: current } });
  });

  await page.goto(origin + "/dashboard/");
  const tools = page.getByRole("navigation", { name: "WIFIGATE Admins only" });
  const entry = tools.locator("#platform-reservations-entry");
  await entry.getByText("WIFIGATE Reservations").waitFor();
  assert.equal(await page.locator(".reservations-entry").count(), 0);
  assert.deepEqual(await tools.locator("a").allTextContents(), ["WIFIGATE Reservations", "Platform management"]);
  await tools.locator("#platform-management-entry").click();
  await page.locator("#platform-admin-management").waitFor();
  assert.equal(await page.locator(".reservations-entry").count(), 0);
  assert.equal(await tools.isHidden(), true);
  assert.equal(adminRequests, 0, "profile and platform management never preload reservations");
  await page.goto(origin + "/dashboard/");
  await entry.click();
  await page.waitForURL(origin + "/dashboard/reservations/");
  await page.getByRole("heading", { name: "WIFIGATE Reservations", level: 1 }).waitFor();
  const row = page.locator(".reservations-admin-row");
  await row.waitFor();
  assert.equal(
    await page.locator(".reservations-filters button[aria-pressed=true]").textContent(),
    "All9",
  );
  await row.locator("summary").click();
  await row.locator(".reservations-admin-form").waitFor();
  await row.locator(".reservations-admin-photos img").waitFor();
  await row.locator("select[name=status]").selectOption("contacted");
  await row.locator("textarea[name=customerNote]").fill("We'll call on Sunday");
  await row.locator("textarea[name=adminNote]").fill("Prefers mornings");
  await row.getByRole("button", { name: "Save" }).click();
  await row.getByText("Saved.").waitFor();
  assert.deepEqual(posted, [
    {
      version: 1,
      status: "contacted",
      customerNote: "We'll call on Sunday",
      adminNote: "Prefers mornings",
      trackingNumber: null,
    },
  ]);
  await row.locator("summary .reservation-pill", { hasText: "Contacted" }).waitFor();
  await row.getByText("fixture@example.test").first().waitFor();
  assert.equal(await page.locator("[data-stage=new] b").textContent(),"1");
  assert.equal(await page.locator("[data-stage=contacted] b").textContent(),"2");
  if(process.env.WIFIGATE_RESERVATIONS_UX_SCREENSHOTS)await page.locator(".reservations-admin").screenshot({path:process.env.WIFIGATE_RESERVATIONS_UX_SCREENSHOTS+"/detail-en-desktop.png"});
});

test("a signed-in account that is not a WIFIGATE Admin never loads reservations in the dashboard", async (t) => {
  const { origin, browser } = await startSite(t);
  const { page, context } = await scenario(browser, { host: "active" });
  t.after(() => context.close());
  let listed = false;
  await context.route("**/api/v1/product-reservations/admin**", (route) => {
    listed = true;
    return route.fulfill({ status: 403, json: { error: { code: "PLATFORM_ADMIN_REQUIRED" } } });
  });

  await page.goto(origin + "/dashboard/reservations/?lang=he");
  await page.getByText("המסך זמין למנהלי WIFIGATE בלבד.").waitFor();
  assert.equal(listed, false);
  await page.goto(origin + "/dashboard/?lang=he");
  await page.locator("#product-grid").waitFor();
  assert.equal(await page.locator(".reservations-entry").count(), 0);
  assert.equal(await page.locator(".platform-admin-tools").isHidden(), true);
});
