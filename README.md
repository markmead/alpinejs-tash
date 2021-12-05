# Apline JS Tash

Alpine JS plugin `x-tash` allows you to render variables without the need of using `<span x-text="xyz"></span>` 🥳

## Example

### Core

Here's the old way of doing things with `x-text` from Alpine JS

```html
<div x-data="{ name: 'Mark', age: 24, company: 'Wiro' }">
  <p>
    Hello I am <span x-text="name"></span> and I am
    <span x-text="age"></span> years old, currently I work at
    <span x-text="company"></span>
  </p>
</div>
```

### Plugin

Here's the new way of doing things with `x-tash` from the plugin

```html
<div x-data="{ name: 'Mark', age: 24, company: 'Wiro' }">
  <p x-tash="name,age,company">
    Hello I am {name} and I am {age} years old, currently I work at {company}
  </p>
</div>
```

**You don't have to render every variable**

If you only wanted to render the `name` and the `age` you can pass `x-tash="name,age` and `{company}` will be left alone! 🤩

## Install

It's very easy to install Alpine JS plugins! 🙌

### CDN

```html
<script src="https://unpkg.com/alpinejs-tash@1.0.0/dist/tash.min.js"></script>
<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

### NPM/Yarn

```shell
npm i -D alpinejs-tash

yarn add -D alpinejs-tash
```

Then you can register the plugin.

```js
import Alpine from "alpinejs";
import tash from "alpinejs-tash";

Alpine.plugin(tash);

window.Alpine = Alpine;

Alpine.start();
```

### Stats

![](https://img.shields.io/bundlephobia/min/alpinejs-tash)
![](https://img.shields.io/npm/v/alpinejs-tash)
![](https://img.shields.io/npm/dt/alpinejs-tash)
![](https://img.shields.io/github/license/markmead/alpinejs-tash)