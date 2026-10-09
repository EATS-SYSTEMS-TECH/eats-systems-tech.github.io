import { build } from "esbuild";
import { mkdir, copyFile } from "node:fs/promises";

await build({
  entryPoints: ["js/host-dashboard.js"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  outfile: "js/host-dashboard.bundle.js",
  minify: true,
  plugins: [
    {
      name: "public-host-config",
      setup(builder) {
        // Preserve the runtime environment boundary, including emulator overrides.
        builder.onResolve({ filter: /host-api-config\.js$/ }, () => ({
          path: "./host-api-config.js",
          external: true,
        }));
      },
    },
  ],
});

// Static hosting needs a real document for the admin deep link.
await mkdir("dashboard/host/overview", { recursive: true });
await copyFile(
  "dashboard/host/index.html",
  "dashboard/host/overview/index.html",
);
