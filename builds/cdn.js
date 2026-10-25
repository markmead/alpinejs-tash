import tash from '../src/index.js'

// CDN users have no import to pass options through, so config is read from a
// global set before this script runs.
document.addEventListener('alpine:init', () =>
  window.Alpine.plugin(tash(window.tashConfig))
)

window.Tash = tash
