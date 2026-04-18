import esbuild from "esbuild";
import sveltePlugin from "esbuild-svelte";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const sveltePreprocess = require("svelte-preprocess");

esbuild.build({
  entryPoints: ["main.ts"],
  bundle: true,
  external: ["obsidian", "@obsidian/obsidian"],
  outfile: "main.js",
  format: "cjs",
  target: "ES6",
  logLevel: "info",
  plugins: [
    sveltePlugin({
      preprocess: sveltePreprocess(),
      compilerOptions: { css: "injected" }
    })
  ]
}).catch(() => process.exit(1));