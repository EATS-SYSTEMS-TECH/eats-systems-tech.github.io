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
} from "./lib/host-booking-site.mjs";

test("booking editor preserves PMS access notes, edits overrides and accepts coordinate zero", async (t) => {
  const site = await startHostSite(t);
  const { page, errors } = await openWorkspace(
    t,
    site,
    {
      plan: "user",
      organizations: [organization("hotel", "Hotel", "owner")],
      systems: { hotel: [system("room", "Room 101")] },
      reservations: {
        hotel: [
          booking("stay", "room", "Room 101", day(1), day(2), {
            accessNote: {
              residentName: "Reception",
              note: "Original note",
              latitude: 0,
              longitude: 0,
            },
            integration: { mode: "direct" },
          }),
        ],
      },
    },
    { query: "?view=bookings" },
  );
  await loaded(page, "bookings");
  await page.locator('[data-bookings-tab="upcoming"]').click();
  await page.locator('.booking-row[data-booking-id="stay"]').click();
  let sheet = page.locator("dialog.booking-sheet[open]");
  assert.match(await sheet.innerText(), /Reception/);
  await sheet.locator("[data-booking-edit]").click();
  sheet = page.locator("dialog.booking-sheet[open]");
  await sheet.locator(".booking-form__more > summary").click();
  await sheet.locator(".booking-access-note > summary").click();
  assert.equal(
    await sheet.locator('input[name="accessNote.latitude"]').inputValue(),
    "0",
  );
  await sheet
    .locator('input[name="accessNote.note"]')
    .fill("Use the side entrance");
  await sheet
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await page.waitForFunction(() =>
    window.fixture.requests.some(
      (row) => row.call === "PUT /api/v1/organizations/hotel/reservations/stay",
    ),
  );
  const saved = (await requests(page)).find(
    (row) => row.call === "PUT /api/v1/organizations/hotel/reservations/stay",
  );
  assert.deepEqual(saved.body.accessNote, {
    note: "Use the side entrance",
    residentName: "Reception",
    latitude: 0,
    longitude: 0,
  });
  assert.equal(saved.body.version, 1);
  assert.deepEqual(errors, []);
});
