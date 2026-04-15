import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["main.ts"],
  bundle: true,
  external: ["obsidian", "@obsidian/obsidian"],
  outfile: "main.js",
  format: "cjs",
  target: "ES6",
  logLevel: "info",
}).catch(() => process.exit(1));