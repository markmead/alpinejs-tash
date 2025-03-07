export default function (Alpine) {
  Alpine.directive(
    'tash',
    (el, { modifiers, expression }, { evaluate, effect }) => {
      const expressionFinder = (expression) =>
        new RegExp(`${leftDelimiter}${expression}${rightDelimiter}`, 'g')

      const useVue = modifiers.includes('vue')
      const useAngular = modifiers.includes('angular')

      const leftDelimiter = useVue ? '{{ ' : useAngular ? '{{' : '{'
      const rightDelimiter = useVue ? ' }}' : useAngular ? '}}' : '}'

      const expressionArray = expression
        .split(',')
        .map((expressionItem) => expressionItem.trim())

      const htmlReference = document.createElement('template')

      htmlReference.innerHTML = el.innerHTML

      let componentHtml = `${htmlReference.innerHTML}`

      effect(() => {
        expressionArray.forEach((expression) => {
          const evaluatedValue = evaluate(expression)
          const finderRegex = expressionFinder(expression)

          componentHtml = componentHtml.replace(finderRegex, evaluatedValue)
        })

        el.innerHTML = componentHtml

        componentHtml = htmlReference.innerHTML
      })
    }
  )
}
