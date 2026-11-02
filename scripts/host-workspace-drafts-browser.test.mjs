import test from "node:test";
import assert from "node:assert/strict";
import {
  startHostSite,
  openWorkspace,
  organization,
  loaded,
  requests,
} from "./lib/host-booking-site.mjs";

const fixture = () => ({
  plan: null,
  organizations: [
    organization("hotel", "Hotel One", "owner"),
    organization("other", "Hotel Two", "owner"),
  ],
});
async function select(page, id) {
  await page.locator("#workspace-org-switcher button").first().click();
  await page.locator(`[data-organization-id="${id}"]`).click();
  await page.waitForFunction(
    (id) =>
      document.querySelector("#host-management").dataset.organizationId === id,
    id,
  );
  await loaded(page, "systems");
}
async function settings(page) {
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent("host:workspace-view", { detail: "settings" }),
    ),
  );
  await loaded(page, "settings");
}

test("back across organizations preserves a hidden settings draft when leaving is cancelled", async (t) => {
  const site = await startHostSite(t);
  const { page, errors } = await openWorkspace(t, site, fixture(), {
    query: "?view=systems",
  });
  await loaded(page, "systems");
  await select(page, "other");
  await settings(page);
  await page
    .getByRole("textbox", { name: "Organization name", exact: true })
    .fill("Unsaved hotel details");
  const original = page.url();
  let prompts = 0;
  page.on("dialog", (dialog) => {
    prompts++;
    return dialog.dismiss();
  });
  await page.goBack();
  await loaded(page, "systems");
  const before = (await requests(page)).length;
  await page.goBack();
  await loaded(page, "settings");
  assert.equal(prompts, 1);
  assert.equal(page.url(), original);
  assert.equal(
    await page.locator("#host-management").getAttribute("data-organization-id"),
    "other",
  );
  assert.equal(
    await page
      .getByRole("textbox", { name: "Organization name", exact: true })
      .inputValue(),
    "Unsaved hotel details",
  );
  assert.equal(
    (await requests(page)).length,
    before,
    "Cancellation does not reload or request another organization",
  );
  assert.deepEqual(errors, []);
});

test("accepting back navigation clears the old organization draft and loads current membership", async (t) => {
  const site = await startHostSite(t);
  const { page, errors } = await openWorkspace(t, site, fixture(), {
    query: "?view=systems",
  });
  await loaded(page, "systems");
  await select(page, "other");
  await settings(page);
  await page
    .getByRole("textbox", { name: "Organization name", exact: true })
    .fill("Unsaved other hotel");
  let prompts = 0;
  page.on("dialog", (dialog) => {
    prompts++;
    return dialog.accept();
  });
  await page.goBack();
  await loaded(page, "systems");
  const before = (await requests(page)).length;
  await page.goBack();
  await page.waitForFunction(
    () =>
      document.querySelector("#host-management").dataset.organizationId ===
      "hotel",
  );
  await loaded(page, "systems");
  assert.equal(prompts, 1);
  assert.equal(
    await page.locator('input[value="Unsaved other hotel"]').count(),
    0,
  );
  assert.ok(
    (await requests(page))
      .slice(before)
      .some((item) => item.call === "GET /api/v1/organizations"),
  );
  await settings(page);
  assert.equal(
    await page
      .getByRole("textbox", { name: "Organization name", exact: true })
      .inputValue(),
    "Hotel One",
  );
  assert.deepEqual(errors, []);
});

test("forward across organizations can be cancelled without losing a draft or navigating twice", async (t) => {
  const site = await startHostSite(t);
  const { page, errors } = await openWorkspace(t, site, fixture(), {
    query: "?view=settings",
  });
  await loaded(page, "settings");
  await select(page, "other");
  await page.goBack();
  await page.waitForFunction(
    () =>
      document.querySelector("#host-management").dataset.organizationId ===
      "hotel",
  );
  await loaded(page, "settings");
  await page
    .getByRole("textbox", { name: "Organization name", exact: true })
    .fill("Keep this draft");
  const original = page.url();
  let prompts = 0;
  page.on("dialog", (dialog) => {
    prompts++;
    return dialog.dismiss();
  });
  const dialog = page.waitForEvent("dialog");
  await page.goForward();
  await dialog;
  await page.waitForURL(original);
  assert.equal(prompts, 1);
  assert.equal(page.url(), original);
  assert.equal(
    await page
      .getByRole("textbox", { name: "Organization name", exact: true })
      .inputValue(),
    "Keep this draft",
  );
  assert.equal(
    await page.locator("#host-management").getAttribute("data-organization-id"),
    "hotel",
  );
  assert.deepEqual(errors, []);
});

test("read-only filters do not count as drafts and session reset always clears sensitive editors", async (t) => {
  const site = await startHostSite(t);
  const { page, errors } = await openWorkspace(t, site, fixture(), {
    query: "?view=settings",
  });
  await loaded(page, "settings");
  let prompts = 0;
  page.on("dialog", (dialog) => {
    prompts++;
    return dialog.dismiss();
  });
  await page.evaluate(async () => {
    const { confirmHostWorkspaceLeave } =
      await import("/js/host-workspace-drafts.js");
    const root = document.querySelector("#host-management");
    const billing = document.createElement("section");
    billing.dataset.settingsPanel = "billing";
    billing.innerHTML =
      '<form class="settings-form"><input name="from" type="date" value="2026-10-01"></form>';
    root.append(billing);
    const date = billing.querySelector("input");
    date.focus();
    date.value = "2026-11-01";
    if (!confirmHostWorkspaceLeave(root))
      throw new Error("Read-only statement filters must not block leaving");
    billing.remove();
  });
  assert.equal(prompts, 0);
  await page
    .getByRole("textbox", { name: "Organization name", exact: true })
    .fill("Sensitive unsaved details");
  await page.evaluate(async () => {
    const { clearHostManagement } = await import("/js/host-management.js");
    clearHostManagement({ sessionEnded: true });
  });
  assert.equal(prompts, 0);
  assert.equal(await page.locator("#host-management form").count(), 0);
  assert.equal(new URL(page.url()).searchParams.has("org"), false);
  assert.deepEqual(errors, []);
});
