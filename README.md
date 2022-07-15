# Alpine JS Tash

Alpine JS plugin to stop the need of `x-text="..."` to render Alpine JS data 🥳

## Example 👀

### Core

Here's the approach you'd take if you were using `x-text`

```html
<div x-data="{ name: 'Mark', age: 24, company: 'Neon & GetCandy' }">
  <p>
    Hello I am <span x-text="name"></span> and I am
    <span x-text="age"></span> years old, currently I work at
    <span x-text="company"></span>
  </p>
</div>
```

### Plugin

Here's the approach you'd take if you were using `x-tash`

```html
<div x-data="{ name: 'Mark', age: 25, company: 'Neon & GetCandy' }">
  <p x-tash="name,age,company">
    Hello I am {name} and I am {age} years old, currently I work at {company}
  </p>
</div>
```

_You can add spaces after your commas in `x-tash`, it doesn't have to follow the example format_

**🙋 You don't have to render every variable**

From the example, if you wanted to render the `name` and `age` then you can pass `x-tash="name,age` and `{company}` will be ignored! 🤩

## Install 🌟

It's very easy to install Alpine JS plugins! 🙌

### CDN

```html
<script
  defer
  src="https://unpkg.com/alpinejs-tash@1.x.x/dist/tash.min.js"
></script>

<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

### NPM/Yarn

```shell
npm i -D alpinejs-tash

yarn add -D alpinejs-tash
```

Then you can register the plugin.

```js
import Alpine from 'alpinejs'
import tash from 'alpinejs-tash'

Alpine.plugin(tash)

window.Alpine = Alpine

Alpine.start()
```

## Options 🧐

### Changing Delimiters

It's possible to change the defaul delimiters `{}` by adding the `x-tash-delimitiers` attribute.

```html
<p x-tash="..." x-tash-delimiters='["{{", "}}"]'>...</p>
<p x-tash="..." x-tash-delimiters='["*", "*"]'>...</p>
<p x-tash="..." x-tash-delimiters='["@@", "@@"]'>...</p>
<p x-tash="..." x-tash-delimiters='[":", "("]'>...</p>
```

_It's required to wrap the value of `x-tash-delimiters` in single quotes._

### Stats 📊

![](https://img.shields.io/bundlephobia/min/alpinejs-tash)
![](https://img.shields.io/npm/v/alpinejs-tash)
![](https://img.shields.io/npm/dt/alpinejs-tash)
![](https://img.shields.io/github/license/markmead/alpinejs-tash)
