var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// builds/module.js
__export(exports, {
  default: () => module_default
});

// src/index.js
function src_default(Alpine) {
  Alpine.directive("tash", (el, {}, { evaluate, effect }) => {
    let expressions = el.getAttribute("x-tash").split(",");
    let template = document.createElement("template");
    let finder = (exp) => new RegExp(`{${exp}}`, "g");
    template.innerHTML = el.innerHTML;
    let html = `${template.innerHTML}`;
    effect(() => {
      expressions.forEach((exp) => {
        let value = evaluate(exp);
        let regex = finder(exp);
        html = html.replace(regex, value);
      });
      el.innerHTML = html;
      html = template.innerHTML;
    });
  });
}

// builds/module.js
var module_default = src_default;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
