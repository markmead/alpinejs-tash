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
export {
  module_default as default
};
