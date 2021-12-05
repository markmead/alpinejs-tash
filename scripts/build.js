let fs = require("fs");

build({
  entryPoints: [`builds/cdn.js`],
  outfile: `dist/tash.min.js`,
  bundle: true,
  minify: true,
  sourcemap: false,
  platform: "browser",
  define: { CDN: true },
});

build({
  entryPoints: [`builds/module.js`],
  outfile: `dist/tash.esm.js`,
  bundle: true,
  bundle: true,
  platform: "neutral",
  mainFields: ["main", "module"],
});

build({
  entryPoints: [`builds/module.js`],
  outfile: `dist/tash.cjs.js`,
  bundle: true,
  target: ["node10.4"],
  platform: "node",
});

function build(options) {
  options.define || (options.define = {});
  options.define["process.env.NODE_ENV"] = process.argv.includes("--watch")
    ? `'production'`
    : `'development'`;

  return require("esbuild")
    .build({
      watch: process.argv.includes("--watch"),
      ...options,
    })
    .catch(() => process.exit(1));
}
