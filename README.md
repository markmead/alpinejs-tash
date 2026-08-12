# Alpine JS Tash

![](https://img.shields.io/bundlephobia/minzip/alpinejs-tash)
![](https://img.shields.io/npm/v/alpinejs-tash)
![](https://img.shields.io/npm/dt/alpinejs-tash)
![](https://img.shields.io/github/license/markmead/alpinejs-tash)

Render Alpine JS data with `{curly braces}` instead of `x-text` 🚀

Alpine JS Tash (Template Hash) brings the interpolation syntax you already know
from React, Vue, Svelte and Angular to Alpine. Write the value where it belongs —
in the middle of a sentence — instead of splitting the sentence into `<span>`s.

```html
<p x-tash>Hello, I am {name} and I am {age} years old!</p>
```

Against the `x-text` equivalent:

```html
<p>Hello, I am <span x-text="name"></span> and I am <span x-text="age"></span> years old!</p>
```

## Features

- 🔍 Keys are detected from the template — no need to list them
- 🎨 Three syntax styles: `{name}`, `{{ name }}`, `{{name}}`
- 🏷️ Works in text **and** in attributes
- 🔄 Fully reactive, and updates without rebuilding your DOM
- 🛡️ Values render as text, so data can't inject markup
- 🪶 ~1KB gzipped, zero dependencies

## Install

### CDN

```html
<script defer src="https://unpkg.com/alpinejs-tash@latest/dist/cdn.min.js"></script>

<script defer src="https://unpkg.com/alpinejs@latest/dist/cdn.min.js"></script>
```

Tash must load **before** Alpine, as with every Alpine plugin.

### Package Manager

```shell
pnpm add -D alpinejs-tash

yarn add -D alpinejs-tash

npm install -D alpinejs-tash
```

```js
import Alpine from 'alpinejs'
import tash from 'alpinejs-tash'

Alpine.plugin(tash)

window.Alpine = Alpine

Alpine.start()
```

## Usage

Add `x-tash` to an element and use `{key}` anywhere inside it:

```html
<div x-data="{ name: 'Walter White', age: 50, company: 'Gray Matter Technologies' }">
  <p x-tash>
    Hello, I am {name}! I am {age} years old and I currently work at {company}!
  </p>

  <!-- Hello, I am Walter White! I am 50 years old and I currently work at Gray Matter Technologies! -->
</div>
```

Anything that works in an Alpine expression works as a key, including nested
paths, array indexes and getters:

```html
<p x-tash>{user.name} has {user.orders.length} orders, worth {orderTotal}</p>
```

### Listing keys explicitly

Passing a comma-separated list restricts rendering to those keys, and leaves
every other `{...}` in the template untouched. This is the v1 syntax, and it
still works:

```html
<p x-tash="name, age">Hi {name}, you are {age}. This stays literal: {company}</p>
```

Use it when your markup contains literal braces you don't want touched.
Otherwise leave `x-tash` empty and let it find the keys.

### Attributes

Placeholders in attributes are interpolated too:

```html
<div x-data="{ label: 'Close dialog', theme: 'dark' }">
  <button x-tash title="{label}" data-theme="{theme}">×</button>

  <!-- <button title="Close dialog" data-theme="dark">×</button> -->
</div>
```

Alpine's own attributes — anything starting with `x-`, `@` or `:` — are skipped,
because Alpine already evaluates those as expressions. Use `:title="label"` for
those, not `title="{label}"`.

## Syntax Styles

| Modifier   | Syntax       |
| ---------- | ------------ |
| none       | `{name}`     |
| `.vue`     | `{{ name }}` |
| `.angular` | `{{name}}`   |

```html
<p x-tash>Hello, {name}!</p>

<p x-tash.vue>Hello, {{ name }}!</p>

<p x-tash.angular>Hello, {{name}}!</p>
```

`.vue` and `.angular` are aliases for the same `{{ }}` pair — whitespace inside
the braces is optional in both, so pick whichever reads better to you.

Choose one style per element. Mixing `{ }` and `{{ }}` inside the same `x-tash`
is not supported.

## How Values Render

| Value                | Renders as                    |
| -------------------- | ----------------------------- |
| `'Walter'`           | `Walter`                      |
| `50`                 | `50`                          |
| `null` / `undefined` | _(empty string)_              |
| `{ a: 1 }`           | `{"a":1}`                     |
| `'<b>bold</b>'`      | `<b>bold</b>` as visible text |

Values are written as **text**, never parsed as HTML. A value containing markup
shows up as characters on the page, so user-supplied data can't inject elements.
If you genuinely want to render HTML, use Alpine's `x-html` — and only on
content you trust.

## Notes & Limitations

**The template is read once, at init.** Tash snapshots the placeholders when the
element initialises, then writes only into the text nodes and attributes that
contained them. Adding new `{key}` text to the DOM afterwards does nothing.

**Updates preserve your DOM.** Because only matched nodes are rewritten, child
elements keep their identity across updates — a form input keeps its value,
focus isn't lost, event listeners survive, and nested `x-data` components aren't
torn down and rebuilt.

**Keys must exist in scope.** An unresolvable key throws the same Alpine
expression error that `x-text` would.

**Nested `x-tash` elements own their own subtree**, and are skipped by the
parent, so a placeholder is never rendered twice.

**`<script>` and `<style>` contents are never interpolated.**

## Breaking Changes in 2.0.0

- **Values render as text, not HTML.** v1 replaced into `el.innerHTML`, so a
  value containing markup became real elements. If you relied on that, switch
  that binding to `x-html`.
- **The key list is now optional**, and `x-tash` with no expression auto-detects
  keys. Existing `x-tash="a, b"` markup keeps working unchanged.
- **`null` and `undefined` render as an empty string** rather than the text
  `null` / `undefined`, and objects render as JSON rather than `[object Object]`.
- **Placeholders in attributes now render.** Previously only element content was
  processed. If you had a literal `{...}` in an attribute on an `x-tash`
  element, it will now be interpolated.
- **`dist/esm.min.js` is gone**, replaced by `dist/module.mjs` and
  `dist/module.cjs` behind an `exports` map — 1.2.1 declared only `module`, so
  neither `require()` nor Node ESM `import` resolved. Package-name imports are
  unaffected; update any deep imports of the old path. `dist/cdn.min.js` is
  unchanged, so CDN users need no changes.
