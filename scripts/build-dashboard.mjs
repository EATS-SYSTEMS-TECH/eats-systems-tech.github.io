import { build } from "esbuild";
import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  dashboardBundle,
  pickerBundle,
  hostPage,
  overviewPage,
  root,
} from "./lib/bundles.mjs";

await Promise.all([build(dashboardBundle), build(pickerBundle)]);

// Static hosting needs a real document for the Platform deep link.
await mkdir(path.join(root, path.dirname(overviewPage)), { recursive: true });
await copyFile(path.join(root, hostPage), path.join(root, overviewPage));
// The global admin page shares the authenticated shell, with its own view.
const managementPage = path.join(root, "dashboard/platform/index.html");
await mkdir(path.dirname(managementPage), { recursive: true });
const profilePage = await readFile(
  path.join(root, "dashboard/index.html"),
  "utf8",
);
await writeFile(
  managementPage,
  profilePage.replace(
    'data-product=""',
    'data-product="" data-platform-view="management"',
  ),
);
const managerManagementPage = path.join(
  root,
  "dashboard/manager/platform/index.html",
);
await mkdir(path.dirname(managerManagementPage), { recursive: true });
const managerPage = await readFile(
  path.join(root, "dashboard/manager/index.html"),
  "utf8",
);
await writeFile(
  managerManagementPage,
  managerPage.replace(
    'data-product="manager"',
    'data-product="manager" data-manager-view="management"',
  ),
);
