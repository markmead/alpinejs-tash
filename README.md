# Apline JS Tash

Alpine JS plugin `x-tash` allows you to render variables without the need of using `<span x-text="variable"></span>`! 🎉

**Old (with `x-text`)**

```html
<div x-data="{ name: 'Mark', age: 24, company: 'Wiro' }">
  <p>
    Hello I am <span x-text="name"></span> and I am
    <span x-text="age"></span> years old, currently I work at
    <span x-text="company"></span>
  </p>
</div>
```

**New (with `x-tash`)**

```html
<div x-data="{ name: 'Mark', age: 24, company: 'Wiro' }">
  <p x-tash="name,age,company">
    Hello I am {name} and I am {age} years old, currently I work at {company}
  </p>
</div>
```
