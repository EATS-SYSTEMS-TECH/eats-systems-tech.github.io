import { build } from "esbuild";
import { apiBundle } from "./lib/bundles.mjs";

await build(apiBundle);
