export default function (Alpine) {
  Alpine.directive('tash', (el, {}, { evaluate, effect }) => {
    const [leftDelimiter, rightDelimiter] = JSON.parse(
      el.getAttribute('x-tash-delimiters')
    ) || ['{', '}']

    const componentExpressions = el
      .getAttribute('x-tash')
      .split(',')
      .map((expression) => expression.trim())

    const templateEl = document.createElement('template')

    const findExpression = (expression) =>
      new RegExp(`${leftDelimiter}${expression}${rightDelimiter}`, 'g')

    templateEl.innerHTML = el.innerHTML

    let componentHtml = `${templateEl.innerHTML}`

    effect(() => {
      componentExpressions.forEach((expression) => {
        const evaluatedValue = evaluate(expression)

        const finderRegex = findExpression(expression)

        componentHtml = componentHtml.replace(finderRegex, evaluatedValue)
      })

      el.innerHTML = componentHtml

      componentHtml = templateEl.innerHTML
    })
  })
}
