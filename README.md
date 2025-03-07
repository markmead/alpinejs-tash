# Alpine JS Tash

![](https://img.shields.io/bundlephobia/min/alpinejs-tash)
![](https://img.shields.io/npm/v/alpinejs-tash)
![](https://img.shields.io/npm/dt/alpinejs-tash)
![](https://img.shields.io/github/license/markmead/alpinejs-tash)

Use a more familiar syntax when rendering Alpine JS `{variables}` 🚀

Alpine JS Tash (Template Hash) lets you use templating syntax from popular
frameworks to render Alpine JS data. Instead of writing `x-text` expressions,
simply use curly braces like React, Vue, or Angular in your markup.

## Features

- 💪 Framework-familiar syntax (`{variable}`, `{{ variable }}`, etc.)
- 🔄 Fully reactive with Alpine JS data
- 🎨 Multiple template styles (React/Svelte, Vue, Angular)
- 🪶 Lightweight addition to your Alpine JS projects
- 🧩 Simple plugin integration

## Why Use Tash?

Tash makes Alpine JS templates more readable and familiar, especially if you're
coming from other frameworks. It simplifies string interpolation without
sacrificing Alpine JS reactivity system.

## Install

### CDN

```html
<script
  defer
  src="https://unpkg.com/alpinejs-tash@latest/dist/cdn.min.js"
></script>

<script defer src="https://unpkg.com/alpinejs@latest/dist/cdn.min.js"></script>
```

### Package

```shell
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

## Example

```html
<div
  x-data="{ name: 'Walter White', age: 50, company: 'Gray Matter Technologies' }"
>
  <p x-tash="name, age, company">
    Hello, I am {name}! I am {age} years old and I currently work at {company}!
  </p>

  <!-- Hello, I am Walter White! I am 50 years old and I currently work at Gray Matter Technologies! -->
</div>
```

## Options

## Template Syntax Options

Alpine JS Tash supports different template syntax styles to match your
preference:

### Default: React/Svelte Style

```html
<div x-data="{ name: 'John' }">
  <p x-tash="name">Hello, {name}!</p>
</div>
```

### Vue Style

```html
<div x-data="{ name: 'John' }">
  <p x-tash.vue="name">Hello, {{ name }}!</p>
</div>
```

### Angular Style

```html
<div x-data="{ name: 'John' }">
  <p x-tash.angular="name">Hello, {{name}}!</p>
</div>
```

Choose the syntax that feels most comfortable based on your background or
project requirements.
