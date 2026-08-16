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
properties destructured from Alpine's own objects (`{ expression }`,
`{ effect, cleanup }`, `{ name, value }` off an attribute), which keep the names
they arrive with.

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

### Bind per node, render many — the load-bearing constraint

A binding is one text node or one attribute. On binding, the node's current
string is captured as `templateText`; every later render replaces into that
captured string and writes back to `nodeValue` / `setAttribute`.

This is what separates 2.0.0 from 1.x, which rebuilt `el.innerHTML` on every
reactive tick. Writing `innerHTML` destroys and recreates every child, so it lost
focus, input values, event listeners and nested `x-data` state on each update,
and rendered values as HTML. Do not reintroduce an `innerHTML` write.

Consequences worth remembering before changing anything:

- Values are written to text nodes, so they render as text. That is the XSS
  boundary — anything that stringifies into markup must stay out of `innerHTML`.
- Renders are diffed against current content before writing, so an effect that
  recomputes an unchanged string touches no DOM.
- Capturing `templateText` is one-shot per node, which is why `boundTextNodes` /
  `boundAttributes` exist. `x-for` reports moved nodes as newly added, and
  re-binding one would capture its *rendered* output as the new template.

### Dynamic content

A `MutationObserver` on the host element binds nodes that `x-for` and `x-if`
insert after init. Only `childList` is observed — rendering writes `nodeValue`
and attributes, so observing either would feed back into itself.

Each binding compiles its evaluators against **its own element**
(`Alpine.evaluateLater(ownerEl, ...)`), not the host, which is what makes a key
resolve against the `x-for` scope it sits in.

Effects are created **per batch of newly bound nodes**, not per binding, so a
churning list doesn't accumulate an effect per row ever rendered. Each effect
prunes disconnected bindings from its own batch as it runs.

### Per-key evaluation

Each key gets its own evaluator. This is deliberate and worth not "optimising"
back into a single batched expression: Alpine catches expression errors
internally and **never invokes the callback**, so one unresolvable key in a
batched `[(a),(b)]` silently blanked every placeholder on the element. Per key, a
failure just leaves that one placeholder as literal text — a `try/catch` cannot
achieve this, because nothing is thrown to us.

### Other non-obvious pieces

- Delimiters are configurable, so the placeholder pattern can't assume braces.
  It captures `[\s\S]+?` lazily rather than `[^{}]`, and `findTemplateKeys`
  discards a captured key containing either delimiter — that's an unbalanced
  `{a {b}`, which should stay literal rather than reach Alpine.
- `buildPlaceholderPattern` returns a **non-global** regex by default. The same
  object is reused across many `.test()` calls, and a `g` flag would carry
  `lastIndex` between them and skip nodes. Only the pattern used for `matchAll`
  and `replace` asks for `g`; both of those handle `lastIndex` safely.
- Delimiters go through `escapeRegExp` — they're user input now.
- Replacement uses a **function**, not a string. A value containing `$&` or
  `` $` `` would otherwise be interpreted as a replacement pattern.
- The default export is dual-mode: `Alpine.plugin(tash)` and
  `Alpine.plugin(tash({ ... }))` both work, distinguished by duck-typing
  `typeof alpineCandidate?.directive === 'function'`. The CDN build reads
  `window.tashConfig`, since a CDN user has no import to pass options through.
- The TreeWalker rejects subtrees of nested `x-tash` elements (they render
  themselves) and of `<script>`/`<style>`/`<template>`. Template content is
  reached through the clones `x-for` and `x-if` insert, not directly.
- Attributes matching `x-`, `@` or `:` are skipped — Alpine evaluates those as
  expressions, and interpolating into one would corrupt it.
