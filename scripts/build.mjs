import { buildSync } from 'esbuild'

// Kept at dist/cdn.min.js: existing `@latest` script tags point here, so
// renaming it would break every CDN consumer on upgrade.
buildPlugin({
  entryPoints: ['builds/cdn.js'],
  outfile: 'dist/cdn.min.js',
})

// Extensions are explicit (.mjs/.cjs) because package.json has no "type"
// field, so a bare .js ESM file fails to parse for Node ESM consumers.
buildPlugin({
  entryPoints: ['builds/module.js'],
  outfile: 'dist/module.mjs',
  format: 'esm',
  platform: 'neutral',
  mainFields: ['main', 'module'],
})

// The CJS entry must be the plugin function itself, not `{ default: fn }`, so
// that `Alpine.plugin(require('alpinejs-tash'))` works.
buildPlugin({
  entryPoints: ['builds/module.js'],
  outfile: 'dist/module.cjs',
  format: 'cjs',
  platform: 'neutral',
  mainFields: ['main', 'module'],
  footer: { js: 'module.exports = module.exports.default' },
})

function buildPlugin(buildOptions) {
  return buildSync({
    ...buildOptions,
    minify: true,
    bundle: true,
  })
}
