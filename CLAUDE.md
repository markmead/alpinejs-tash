# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```shell
pnpm install    # esbuild is the only dependency
pnpm build      # bundles + minifies builds/*.js into dist/
```

pnpm is pinned via `packageManager` in `package.json`. `pnpm-workspace.yaml` sets
`minimumReleaseAge` (48h supply-chain cooldown) and allowlists esbuild's
postinstall, which pnpm blocks by default.

There is no test suite, linter, or dev server. Verification is manual: create an
`index.html` at the repo root (gitignored for this purpose), serve it, and load
`dist/cdn.min.js` before `alpinejs` from a CDN. Assert after
`await Alpine.nextTick()` — Alpine flushes reactive effects on the next tick, so
a check made synchronously after a write sees the old DOM.

`dist/` is committed to git, not just published. Run `pnpm build` and commit the
output alongside any change to `src/` or `builds/`, or the CDN build drifts from
source. `files` limits the npm tarball to `dist/`.

## Conventions

Modern JavaScript only — ESM `import`, `??`, `?.`, optional catch binding.
esbuild has no `target` set, so nothing is downlevelled; don't add transpilation
workarounds for old browsers.

**Every function and variable name is at least two words** — `templateKeys` not
`keys`, `renderValue` not `render`, `hostEl` not `el`. The exception is
properties destructured from Alpine's own objects (`{ modifiers, expression }`,
`{ effect, evaluateLater }`, `{ name, value }` off an attribute), which keep the
names they arrive with.

Alpine is never a dependency. The plugin uses the `Alpine` instance handed to it,
and the CDN build uses the global. Keep it that way.

## Architecture

`src/index.js` is the whole implementation — one directive, `x-tash`. Everything
else is packaging:

- `builds/cdn.js` — browser entry; self-registers on `alpine:init` against
  `window.Alpine`.
- `builds/module.js` — bundler entry; re-exports the plugin for
  `Alpine.plugin(tash)`.
- `scripts/build.mjs` — esbuild config producing `dist/cdn.min.js`,
  `dist/module.mjs` and `dist/module.cjs`. `.mjs` because `package.json` has no
  `type` field and the script uses `import`.

Extensions are explicit because `package.json` has no `type` field. The CJS build
appends `module.exports = module.exports.default` so
`Alpine.plugin(require('alpinejs-tash'))` gets the function rather than a module
namespace object. `exports`/`main`/`module` must stay in sync with those
filenames — 1.2.1 shipped only `module`, so Node resolved neither `import` nor
`require`. `dist/cdn.min.js` keeps its name deliberately: existing `@latest`
script tags point at it.

### Bind once, render many — the load-bearing constraint

The directive walks the element **once at init** and collects a binding per text
node and per attribute that contains a placeholder, capturing that node's
original string as `templateText`. Every later render replaces into that captured
string and writes the result back to `nodeValue` / `setAttribute`.

This is what separates 2.0.0 from 1.x, which rebuilt `el.innerHTML` on every
reactive tick. Writing `innerHTML` destroys and recreates every child, so it lost
focus, input values, event listeners and nested `x-data` state on each update,
and rendered values as HTML. Do not reintroduce an `innerHTML` write.

Consequences worth remembering before changing anything:

- Placeholders added to the DOM after init are never picked up. The walk does not
  re-run.
- Values are written to text nodes, so they render as text. That is the XSS
  boundary — anything that stringifies into markup must stay out of `innerHTML`.
- Renders are diffed against the current `nodeValue` before writing, so an effect
  that recomputes an unchanged string touches no DOM.

### Other non-obvious pieces

- `evaluateLater` compiles **one** array expression covering every key, so a tick
  is a single evaluation rather than one per key. Each key is wrapped in its own
  parentheses (`[(a),(b)]`) so a key containing a comma stays one array element.
- `buildPlaceholderPattern` returns a **non-global** regex by default. The same
  pattern object is reused across many `.test()` calls during the walk, and a
  `g` flag would carry `lastIndex` between them and skip nodes. Only `findKeys`
  asks for `g`, because `matchAll` requires it.
- Key alternation is sorted longest-first so `{name}` can't match ahead of
  `{nameLong}`.
- Both delimiters and keys go through `escapeRegExp`. Keys are user input and
  routinely contain regex metacharacters — `user.name` unescaped would also match
  `{userXname}`.
- Replacement uses a **function**, not a string. A value containing `$&` or
  `` $` `` would otherwise be interpreted as a replacement pattern.
- `.vue` and `.angular` resolve to the same `{{`/`}}` pair; the patterns allow
  optional inner whitespace, so both spacings work under either modifier.
- The TreeWalker rejects subtrees of nested `x-tash` elements (they render
  themselves) and of `<script>`/`<style>`. It never yields its own root, so the
  host element's attributes are collected separately before the walk.
- Attributes matching `x-`, `@` or `:` are skipped — Alpine evaluates those as
  expressions, and interpolating into one would corrupt it.
