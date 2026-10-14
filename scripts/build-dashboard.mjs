import { build } from "esbuild";
import { mkdir, copyFile } from "node:fs/promises";
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
