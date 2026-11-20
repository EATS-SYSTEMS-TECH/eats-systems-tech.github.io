import test from "node:test";
import assert from "node:assert/strict";
import { managerConnectionError } from "../js/manager-connection-errors.js";

// The gate silently closes the Manager relay when a local administrator opens
// the admin panel over Bluetooth, so the website names that likely cause.
for (const code of ["RESPONSE_TIMEOUT", "DISCONNECTED"]) test(`${code} names the app admin panel as a likely cause`, () => {
  assert.match(managerConnectionError(code, "en").steps[0], /admin panel in the WIFIGATE app near the system/);
  assert.match(managerConnectionError(code, "he").steps[0], /פאנל הניהול באפליקציית WIFIGATE/);
});
test("BUSY tells the administrator to close the app admin panel", () => {
  assert.match(managerConnectionError("BUSY", "en").steps[0], /admin panel may be open in the WIFIGATE app/);
});
