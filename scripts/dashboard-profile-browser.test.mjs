import test from "node:test";
import assert from "node:assert/strict";
import { startSite, scenario } from "./platform-test-fixtures.mjs";

const estimate = (amounts, quantities) => ({kind: "monthly-estimate", currency: "USD", monthlyCents: amounts.reduce((a,b) => a+b,0), lines: Object.fromEntries(["gates", "dualControls", "groups", "organizations"].map((key,i) => [key,{amountCents: amounts[i], quantity: quantities[i]}]))});

test("active subscriptions summary reflects product access rather than pending or blocked plans", async t => {
  const {origin,browser}=await startSite(t);
  for(const language of ['he','en']) for(const item of [
    {host:'active',pay:'active',manager:'active',expected:'Host, Pay, Manager'},
    {host:'mfa-required',pay:'blocked',manager:'pending',expected:'Host'},
    {host:'blocked',pay:'no-plan',manager:'pending',expected:language==='he'?'אין מנויים פעילים':'No active subscriptions'},
  ]) {
    const f=await scenario(browser,{...item,enrolled:true,verified:true,viewport:{width:390,height:1000}});t.after(()=>f.context.close());
    await f.page.goto(origin+'/dashboard/?lang='+language);
    const row=f.page.locator('#profile-details > div').filter({has:f.page.getByText(language==='he'?'מנויים פעילים':'Active subscriptions',{exact:true})});
    await row.waitFor();
    assert.equal(await row.locator('dd').innerText(),item.expected);
    assert.equal(await f.page.locator('#profile-details > div').count(),8);
    assert.equal(await f.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(f.errors,[]);
  }
});

test("For Business access displays WIFIGATE User without granting global administrator status", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) for (const product of ["host", "pay", "manager"]) {
    await t.test(`${language} ${product}`, async (t) => {
      const fixture = await scenario(browser, {
        platformRole: null,
        // A product administrator is still a regular WIFIGATE platform user.
        admin: product === "host",
        host: "no-plan", pay: "no-plan", manager: "no-plan",
        [product]: "active", enrolled: true, verified: true,
        viewport: { width: language === "he" ? 390 : 1440, height: 1000 },
      });
      t.after(() => fixture.context.close());
      const page = fixture.page;
      await page.goto(origin + "/dashboard/" + (language === "he" ? "?lang=he" : ""));
      const details = page.locator("#profile-details");
      await details.getByText("WIFIGATE User", { exact: true }).waitFor();
      assert.equal(await details.getByText("WIFIGATE Admin", { exact: true }).count(), 0);
      assert.equal(await details.locator("dt").first().textContent(), language === "he" ? "תפקיד בחשבון WIFIGATE" : "WIFIGATE account role");
      assert.equal(await details.getByText("WIFIGATE User", { exact: true }).getAttribute("dir"), "auto");
      const subscriptions = details.locator('div').filter({has:page.getByText(language === "he" ? "מנויים פעילים" : "Active subscriptions",{exact:true})});
      assert.equal(await subscriptions.locator('dd').innerText(), {host:'Host',pay:'Pay',manager:'Manager'}[product]);
      assert.equal(await page.locator(".platform-management-entry:visible").count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (process.env.DASHBOARD_PREVIEW_DIR) await page.screenshot({ path: `${process.env.DASHBOARD_PREVIEW_DIR}/account-role-${language}-${product}.png`, fullPage: true });
      assert.deepEqual(fixture.errors, []);
    });
  }
});

test("every dashboard shares a flag selector and profile entry into My profile", async (t) => {
  const { origin, browser } = await startSite(t);
  const chromeReference = new Map();
  for (const language of ["he", "en"])
    for (const width of [320, 768, 1440]) {
      for (const product of ["manager", "host", "pay", ""])
        await t.test(
          `${language} ${width}px ${product || "profile"}`,
          async (t) => {
            const fixture = await scenario(browser, {
              admin: true,
              platformRole: "admin",
              enrolled: true,
              verified: true,
              manager: "active",
              pay: "active",
              productFinancials: {
                host: estimate([8000, 2000, 0, 0], [16,2,0,1]),
                manager: estimate([4940, 760, 0, 0], [26,4,0,2]),
                pay: {kind: "revenue", revenue: {currency: "ILS", amountCents: 12550}},
              },
              personalSummaries: {
                host: { gates: 7, dualControls: 2, groups: 3, organizations: 1 },
                manager: { gates: 11, dualControls: 4, groups: 5, organizations: 2 },
              },
              viewport: { width, height: 1000 },
              hasTouch: width === 320,
              userMetadata: {
                creationTime: "Mon, 15 Jan 2024 12:00:00 GMT",
                lastSignInTime: "invalid",
              },
            });
            t.after(() => fixture.context.close());
            const { page, context } = fixture;
            page.setDefaultTimeout(7000);
            await context.route("**/api/v1/manager/**", (route) =>
              route.fulfill({
                json: new URL(route.request().url()).pathname.endsWith("/me")
                  ? {
                      user: {
                        name: "Fixture User",
                        email: "fixture@example.test",
                      },
                      role: "admin",
                      roles: ["admin"],
                      organizations: [],
                      account: null,
                    }
                  : {
                      admins: 1,
                      users: 1,
                      organizationAdmins: 0,
                      organizations: 0,
                    },
              }),
            );
            const query = language === "he" ? "?lang=he" : "";
            await page.goto(
              origin + `/dashboard/${product ? product + "/" : ""}` + query,
            );
            await page.locator("#product-switcher-button").waitFor();
            const reject = page.locator("[data-cookie-reject]");
            if (await reject.isVisible()) await reject.click();
            const header = page.locator(
              product === "host" ? ".host-topbar" : ".platform-header",
            );
            assert.equal(await header.locator("a.brand").isVisible(), true);
            const chrome = await header.evaluate((el) => {
              const style = getComputedStyle(el), box = el.getBoundingClientRect();
              const pill = el.querySelector("#product-switcher-button"), pillStyle = getComputedStyle(pill), pillBox = pill.getBoundingClientRect();
              return { width: Math.round(box.width), height: Math.round(box.height), radius: style.borderRadius, padding: style.padding, pillWidth: Math.round(pillBox.width), pillHeight: Math.round(pillBox.height), pillBackground: pillStyle.backgroundColor, pillBorder: pillStyle.borderColor };
            });
            const chromeKey = `${language}-${width}`;
            const website = header.getByRole("link", {name:"WIFIGATE Website",exact:true});
            assert.equal(await website.count(),1);
            assert.equal(await website.getAttribute("href"),language === "he" ? "/he/" : "/");
            assert.equal(await website.isVisible(),true);
            const websiteBox = await website.boundingBox();
            assert.ok(websiteBox.width >= 44 && websiteBox.height >= 44);
            const headerControls = [website,header.locator('.platform-language__button'),header.locator('.dashboard-profile-button')];
            const controlBoxes = await Promise.all(headerControls.map(control=>control.boundingBox()));
            for(let i=0;i<controlBoxes.length;i++)for(let j=i+1;j<controlBoxes.length;j++){
              const a=controlBoxes[i],b=controlBoxes[j];
              assert.ok(a.x+a.width<=b.x+1 || b.x+b.width<=a.x+1 || a.y+a.height<=b.y+1 || b.y+b.height<=a.y+1,'website, language and profile controls do not overlap');
            }
            if (!chromeReference.has(chromeKey)) chromeReference.set(chromeKey, chrome);
            else assert.deepEqual(chrome, chromeReference.get(chromeKey), `${product || "profile"} shares dashboard chrome dimensions and styling`);

            if (!product && width >= 651) {
              const switcher = header.locator("#product-switcher-button");
              await switcher.click();
              const switcherBox = await switcher.boundingBox();
              const menuBox = await page.locator(".product-switcher__popover").boundingBox();
              assert.equal(switcherBox.width, menuBox.width);
              assert.ok(Math.abs(switcherBox.x - menuBox.x) < 1);
              await page.keyboard.press("Escape");
            }
            const flag = header.locator(".platform-language__button");
            assert.equal(await flag.innerText(), "");
            assert.equal(await flag.locator("img").isVisible(), true);
            const flagButtonBox = await flag.boundingBox();
            const flagImageBox = await flag.locator("img").boundingBox();
            assert.ok(Math.abs(flagButtonBox.x + flagButtonBox.width / 2 - flagImageBox.x - flagImageBox.width / 2) < 1);
            assert.ok(Math.abs(flagButtonBox.y + flagButtonBox.height / 2 - flagImageBox.y - flagImageBox.height / 2) < 1);
            assert.match(
              await flag.getAttribute("aria-label"),
              language === "he" ? /עברית/ : /English/,
            );
            await flag.click();
            const languages = page.locator("#platform-language-options");
            await languages.waitFor();
            const other = languages.locator(
              `[lang="${language === "he" ? "en" : "he"}"]`,
            );
            assert.equal(
              new URL(await other.getAttribute("href")).pathname,
              `/dashboard/${product ? product + "/" : ""}`,
            );
            await page.keyboard.press("Escape");
            const profile = header.locator(".dashboard-profile-button");
            assert.deepEqual(
              await profile
                .boundingBox()
                .then(({ width, height }) => [width, height]),
              [44, 44],
            );
            await profile.click();
            const panel = header.locator(".dashboard-profile-panel");
            assert.equal(await panel.locator(".dashboard-global-role").innerText(), "WIFIGATE admin");
            const identity = panel.locator('.dashboard-profile-identity');
            assert.equal(await identity.locator('.dashboard-global-role').count(), 1);
            assert.equal(await panel.locator('.dashboard-profile-roles .dashboard-global-role').count(), 0);
            const avatarBox = await identity.locator('.platform-avatar').boundingBox();
            assert.equal(avatarBox.width, 56);
            assert.equal(avatarBox.height, 56);
            const identityEmail = identity.getByText('fixture@example.test', {exact:true});
            const globalRole = identity.locator('.dashboard-global-role');
            assert.deepEqual(await globalRole.evaluate(el => {const s=getComputedStyle(el);return [s.fontSize,s.color,s.fontWeight];}), await identityEmail.evaluate(el => {const s=getComputedStyle(el);return [s.fontSize,s.color,s.fontWeight];}));
            const emailBox = await identityEmail.boundingBox(), roleBox = await globalRole.boundingBox();
            assert.ok(roleBox.y >= emailBox.y + emailBox.height);

            if (product && product !== "manager") {
              const productName = {host:"WIFIGATE Host",pay:"WIFIGATE Pay",manager:"WIFIGATE Manager"}[product];
              assert.deepEqual(await panel.locator(".dashboard-profile-product-card").evaluate(element => [...element.children].map(child => child.textContent)), [productName, productName + " admin"]);
              assert.equal(await panel.locator(".dashboard-profile-product-card").evaluate(element => getComputedStyle(element).borderRadius), "12px");
            }

            assert.equal(
              await panel.locator(".dashboard-profile-eyebrow").count(),
              0,
            );
            assert.equal(
              await panel.getAttribute("aria-label"),
              language === "he" ? "הפרופיל שלי" : "My profile",
            );
            await panel
              .getByText("fixture@example.test", { exact: true })
              .waitFor();
            assert.equal(
              await panel.getByText("fixture@example.test", { exact: true })
                .evaluate((el) => getComputedStyle(el).textAlign),
              language === "he" ? "right" : "left",
            );
            if (product === "manager") {
              assert.equal(await panel.locator('.dashboard-profile-product-card, .manager-role-badge').count(),0);
              assert.equal(await page.locator('.manager-sidebar-roles').innerText(),'WIFIGATE Manager admin');
            }
            assert.equal(
              await panel
                .locator("a.dashboard-profile-identity")
                .getAttribute("href"),
              "/dashboard/" + query,
            );
            assert.equal(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
              true,
            );
            if (process.env.DASHBOARD_PREVIEW_DIR)
              await page.screenshot({
                path: `${process.env.DASHBOARD_PREVIEW_DIR}/shared-header-${product || "profile"}-${language}-${width}.png`,
                fullPage: true,
              });
            await panel.locator("a.dashboard-profile-identity").click();
            await page.waitForURL(origin + "/dashboard/" + query);
            await page
              .getByRole("heading", {
                name: language === "he" ? "הפרופיל שלי" : "My profile",
                exact: true,
              })
              .waitFor();
            await page
              .locator("#profile-details")
              .getByText("fixture@example.test", { exact: true })
              .waitFor();
            assert.equal(
              await page.locator("#profile-subscriptions .product-tile").count(),
              3,
            );
            const details = page.locator("#profile-details");
            assert.equal(await details.getByText("WIFIGATE Admin", { exact: true }).count(), 1);
            assert.equal(await details.getByText("WIFIGATE User", { exact: true }).count(), 0);
            const email = details.getByText("fixture@example.test", { exact: true });
            assert.deepEqual(
              await email.evaluate((el) => ({
                align: getComputedStyle(el).textAlign,
                direction: getComputedStyle(el).direction,
              })),
              { align: language === "he" ? "right" : "left", direction: "ltr" },
            );
            assert.match(await details.innerText(), /2024/);
            assert.match(
              await details.innerText(),
              language === "he" ? /לא זמין כרגע/ : /Not available/,
            );
            const subscriptions = page.locator("#profile-subscriptions");
            assert.equal(
              await subscriptions.getAttribute("data-billing-mode"),
              "preview",
            );
            assert.equal(
              await subscriptions.locator("[data-subscription]").count(),
              3,
            );
            for (const productId of ["host", "pay", "manager"]) {
              const card = subscriptions.locator(`[data-product="${productId}"]`);
              assert.equal(await card.locator(".product-state").count(), 1);
              assert.equal(await card.locator(".profile-product-role").count(), 1);
              assert.equal(await card.locator(".profile-product-billing").count(), 1);
              assert.deepEqual(
                await card.locator("[data-personal-count]").allTextContents(),
                productId === "host" ? ["16", "2", "1"]
                  : productId === "manager" ? ["26", "4", "2"]
                  : [],
              );
              assert.equal(await card.locator('[data-personal-count="groups"]').count(), 0);
              if (productId !== "pay") {
                assert.equal(await card.locator('.info-tip__button').count(), 3);
                const icons = await card.locator('.info-tip__button').evaluateAll(buttons => buttons.map(button => ({x:button.getBoundingClientRect().x, center:button.getBoundingClientRect().y + button.getBoundingClientRect().height / 2, rowCenter:button.closest('tr').getBoundingClientRect().y + button.closest('tr').getBoundingClientRect().height / 2})));
                for (const icon of icons) {
                  assert.ok(Math.abs(icon.x - icons[0].x) < 0.5);
                  assert.ok(Math.abs(icon.center - icon.rowCenter) < 1);
                }
                assert.equal(await card.locator('thead th').count(), 4);
                assert.equal(await card.locator('h3 .info-tip').count(), 0);
                for (const key of ['gates', 'dualControls', 'organizations']) {
                  const tip = card.locator(`[data-cost-info="${key}"]`);
                  const info = tip.locator('button');
                  assert.equal(await info.locator('svg').count(), 1);
                  assert.equal(await info.innerText(), '');
                  if (width === 320) await info.tap();
                  else await info.click();
                  assert.equal(await info.getAttribute('aria-expanded'), 'true');
                  const bubble = tip.locator('[role="tooltip"]');
                  assert.equal(await bubble.isVisible(), true);
                  const rate = language === 'he' ? /פטורים מדמי מנוי/ : /no subscription fees/;
                  assert.match(await bubble.innerText(), rate);
                  const box = await bubble.boundingBox();
                  assert.ok(box.x >= 0 && box.x + box.width <= width);
                  if (process.env.DASHBOARD_PREVIEW_DIR && !product && key === 'dualControls') await page.screenshot({path:`${process.env.DASHBOARD_PREVIEW_DIR}/row-tooltip-${productId}-${language}-${width}.png`});
                  if (width === 320) {
                    await card.locator('.product-state').tap();
                    assert.equal(await bubble.isVisible(), false);
                    await info.tap();
                    assert.equal(await bubble.isVisible(), true);
                  }
                  await page.keyboard.press('Escape');
                  assert.equal(await bubble.isVisible(), false);
                }
              }
              assert.equal(await card.locator(".product-actions a").count(), 3);
              assert.equal(await card.locator(".product-actions > *").count(), 3);
              assert.equal(await card.locator(".product-actions > button").count(), 0);
              assert.equal(await card.locator("[data-personal-cost]").count(), productId === "pay" ? 0 : 3);
              assert.equal(await card.locator(".product-actions > :first-child").textContent(), language === "he" ? "פתיחה" : "Open");
            }
            assert.equal(await subscriptions.locator('[data-subscription-value="status"]').count(), 0);
            assert.match(await subscriptions.locator('[data-product="host"] [data-subscription-value="monthly"]').innerText(), /WIFIGATE Admin/);
            assert.match(await subscriptions.locator('[data-product="manager"] [data-subscription-value="monthly"]').innerText(), /WIFIGATE Admin/);
            assert.equal(await subscriptions.locator('[data-product="pay"] [data-subscription-value="monthly"]').count(), 0);
            assert.match(await subscriptions.locator('[data-subscription-value="revenue"]').innerText(), /125\.50/);
            assert.match(await page.locator('#profile-subscription-total').innerText(), /WIFIGATE Admin/);
            await page.mouse.move(0, 0);
            await page.keyboard.press("Escape");
            if (process.env.DASHBOARD_PREVIEW_DIR)
              await page.screenshot({
                path: `${process.env.DASHBOARD_PREVIEW_DIR}/profile-subscriptions-${language}-${width}.png`,
                fullPage: true,
              });
            assert.deepEqual(fixture.errors, []);
          },
        );
    }
});


test("modern product cards preserve readable identities and inactive Pay access across phone, tablet and desktop", async (t) => {
  const {origin,browser} = await startSite(t);
  for (const language of ['he','en']) for (const width of [320,768,1440]) await t.test(`${language} ${width}px`,async(t) => {
    const fixture = await scenario(browser, {admin:true,enrolled:true,verified:true,manager:'active',pay:'no-plan',viewport:{width,height:1000},productFinancials:{host:estimate([0,0,0,0],[0,0,0,0]),manager:estimate([0,0,0,0],[0,0,0,0])}});
    t.after(()=>fixture.context.close());
    const page = fixture.page;
    await page.goto(origin + '/dashboard/' + (language === 'he' ? '?lang=he' : ''));
    await page.locator('.profile-product-header').last().waitFor();
    for (const id of ['host','pay','manager']) {
      const card = page.locator(`#profile-subscriptions [data-product="${id}"]`);
      await card.getByRole('heading',{name:`WIFIGATE ${id[0].toUpperCase()+id.slice(1)}`,exact:true}).waitFor();
      assert.equal(await card.locator('.profile-product-identity .product-icon svg').count(),1);
      assert.equal(await card.locator('.profile-product-header .product-state').isVisible(),true);
      assert.equal(await card.evaluate(el=>el.scrollWidth <= el.clientWidth),true);
    }
    assert.equal(await page.locator('[data-product="pay"] .product-open').isDisabled(),true);
    assert.equal(await page.locator('[data-product="host"] .product-actions a').count(),3);
    assert.equal(await page.locator('[data-product="manager"] .product-actions a').count(),3);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
    if (process.env.DASHBOARD_PREVIEW_DIR) await page.screenshot({path:`${process.env.DASHBOARD_PREVIEW_DIR}/modern-products-${language}-${width}.png`,fullPage:true});
    assert.deepEqual(fixture.errors,[]);
  });
});
