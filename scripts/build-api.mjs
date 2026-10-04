import { build } from "esbuild";

await build({
  entryPoints: ["api/index.ts"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  outfile: "js/api/index.js",
  minify: true,
  plugins: [{
    name: "public-host-config",
    setup(builder) {
      // Keep the public environment configuration in its own module so changing
      // the API origin does not require rebuilding the API client bundle.
      builder.onResolve({ filter: /host-api-config\.js$/ }, () => ({
        path: "../host-api-config.js",
        external: true,
      }));
    },
  }],
});
