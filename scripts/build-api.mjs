import { build } from "esbuild";

await build({
  entryPoints: ["lib/server/api-bundle.ts"],
  outfile: "lib/server/api-bundle.mjs",
  bundle: true,
  packages: "external",
  platform: "node",
  format: "esm",
  target: "node24",
  tsconfig: "tsconfig.json",
  sourcemap: false,
  logLevel: "info",
});
