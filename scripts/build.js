buildPlugin({
  entryPoints: [`builds/cdn.js`],
  outfile: 'dist/tash.min.js',
})

buildPlugin({
  entryPoints: [`builds/module.js`],
  outfile: `dist/tash.esm.js`,
  platform: 'neutral',
  mainFields: ['main', 'module'],
})

function buildPlugin(buildOptions) {
  return require('esbuild').buildSync({
    ...buildOptions,
    minify: true,
    bundle: true,
  })
}
