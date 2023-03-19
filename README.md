# Alpine JS Tash

Alpine JS plugin to stop the need of `x-text="..."` to render Alpine JS data 🥳

## Install

It's very easy to install Alpine JS plugins! 🙌

### With a CDN

```html
<script
  defer
  src="https://unpkg.com/alpinejs-tash@latest/dist/tash.min.js"
></script>

<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

### With a Package Manager

```shell
npm i -D alpinejs-tash

yarn add -D alpinejs-tash
```

```js
import Alpine from 'alpinejs'
import tash from 'alpinejs-tash'

Alpine.plugin(tash)

window.Alpine = Alpine

Alpine.start()
```

## Example

### Plugin

```html
<div x-data="{ name: 'John Doe', age: 50, company: 'GitHub' }">
  <p x-tash="name, age, company">
    Hello, I am {name}! I am {age} years old and I currently work at {company}!
  </p>

  <!-- Hello, I am John Doe! I am 50 years old and I currently work at GitHub! -->
</div>
```

You don't have to use `{variable}` as your syntax.

If you prefer Vue syntax use `x-tash.vue` and you can write `{{ variable }}` 🐸

If you prefer Angular syntax use `x-tash.angular` and you can write
`{{variable}}` 🦞

By default it will use the `{variable}` syntax that React, Svelte, Solid,
Astro... And many others use.

_All variables you pass to `x-tash` use Alpine JS reactivity!_

### Stats

![](https://img.shields.io/bundlephobia/min/alpinejs-tash)
![](https://img.shields.io/npm/v/alpinejs-tash)
![](https://img.shields.io/npm/dt/alpinejs-tash)
![](https://img.shields.io/github/license/markmead/alpinejs-tash)
