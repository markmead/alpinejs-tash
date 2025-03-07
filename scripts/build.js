buildPlugin({
  entryPoints: ['builds/cdn.js'],
  outfile: 'dist/cdn.min.js',
})

buildPlugin({
  entryPoints: ['builds/module.js'],
  outfile: 'dist/esm.min.js',
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
