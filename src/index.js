// `.vue` and `.angular` are the same delimiter pair — inner whitespace is
// optional everywhere, so `{{ name }}` and `{{name}}` both render.
const DELIMITER_STYLES = {
  default: ['{', '}'],
  vue: ['{{', '}}'],
  angular: ['{{', '}}'],
}

// Alpine owns these attributes and treats their values as expressions, not as
// text, so interpolating into them would corrupt the expression.
const ALPINE_ATTRIBUTE_PATTERN = /^(x-|@|:)/

export default function (Alpine) {
  Alpine.directive(
    'tash',
    (hostEl, { modifiers, expression }, { effect, evaluateLater }) => {
      const [leftDelimiter, rightDelimiter] = resolveDelimiters(modifiers)

      // The template is read once, at init. Every later render writes into the
      // nodes collected here, so child elements, focus and nested Alpine state
      // survive an update.
      const nodeBindings = collectBindings(
        hostEl,
        leftDelimiter,
        rightDelimiter
      )

      if (!nodeBindings.length) return

      const templateKeys = expression.trim()
        ? expression
            .split(',')
            .map((listedKey) => listedKey.trim())
            .filter(Boolean)
        : findTemplateKeys(nodeBindings, leftDelimiter, rightDelimiter)

      if (!templateKeys.length) return

      const keyIndexes = new Map(
        templateKeys.map((templateKey, keyIndex) => [templateKey, keyIndex])
      )
      const keyPattern = buildKeyPattern(
        templateKeys,
        leftDelimiter,
        rightDelimiter
      )

      // One evaluator for every key, compiled once. Each key is parenthesised
      // so that a key containing a comma stays a single array element.
      const evaluateKeys = evaluateLater(
        `[${templateKeys.map((templateKey) => `(${templateKey})`).join(',')}]`
      )

      effect(() =>
        evaluateKeys((keyValues) => {
          for (const nodeBinding of nodeBindings) {
            nodeBinding.renderInto(
              nodeBinding.templateText.replace(
                keyPattern,
                (matchedText, matchedKey) => {
                  const keyIndex = keyIndexes.get(matchedKey)

                  return keyIndex === undefined
                    ? matchedText
                    : renderValue(keyValues[keyIndex])
                }
              )
            )
          }
        })
      )
    }
  )
}

function resolveDelimiters(modifiers) {
  const styleModifier = modifiers.find(
    (modifierName) => modifierName in DELIMITER_STYLES
  )

  return DELIMITER_STYLES[styleModifier] ?? DELIMITER_STYLES.default
}

function collectBindings(rootEl, leftDelimiter, rightDelimiter) {
  const placeholderTest = buildPlaceholderPattern(leftDelimiter, rightDelimiter)
  const nodeBindings = []

  const treeWalker = document.createTreeWalker(
    rootEl,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    {
      acceptNode(visitedNode) {
        if (visitedNode === rootEl) return NodeFilter.FILTER_ACCEPT
        if (visitedNode.nodeType !== Node.ELEMENT_NODE)
          return NodeFilter.FILTER_ACCEPT

        // A nested x-tash owns its own subtree; binding it here as well would
        // render it twice. Script and style text is never interpolated.
        return visitedNode.hasAttribute('x-tash') ||
          visitedNode.tagName === 'SCRIPT' ||
          visitedNode.tagName === 'STYLE'
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT
      },
    }
  )

  // The walker never yields its own root, so the host element's attributes are
  // collected up front.
  collectAttributeBindings(rootEl, placeholderTest, nodeBindings)

  while (treeWalker.nextNode()) {
    const currentNode = treeWalker.currentNode

    if (currentNode.nodeType === Node.ELEMENT_NODE) {
      collectAttributeBindings(currentNode, placeholderTest, nodeBindings)

      continue
    }

    if (!placeholderTest.test(currentNode.nodeValue)) continue

    nodeBindings.push({
      templateText: currentNode.nodeValue,
      renderInto(renderedText) {
        if (currentNode.nodeValue !== renderedText)
          currentNode.nodeValue = renderedText
      },
    })
  }

  return nodeBindings
}

function collectAttributeBindings(targetEl, placeholderTest, nodeBindings) {
  for (const { name, value } of targetEl.attributes) {
    if (ALPINE_ATTRIBUTE_PATTERN.test(name)) continue
    if (!placeholderTest.test(value)) continue

    nodeBindings.push({
      templateText: value,
      renderInto(renderedText) {
        if (targetEl.getAttribute(name) !== renderedText)
          targetEl.setAttribute(name, renderedText)
      },
    })
  }
}

function findTemplateKeys(nodeBindings, leftDelimiter, rightDelimiter) {
  const placeholderPattern = buildPlaceholderPattern(
    leftDelimiter,
    rightDelimiter,
    'g'
  )
  const templateKeys = new Set()

  for (const nodeBinding of nodeBindings) {
    for (const [, matchedKey] of nodeBinding.templateText.matchAll(
      placeholderPattern
    )) {
      templateKeys.add(matchedKey)
    }
  }

  return [...templateKeys]
}

// No `g` flag by default: these patterns are reused across many `.test()`
// calls, and a global regex would carry `lastIndex` between them.
function buildPlaceholderPattern(
  leftDelimiter,
  rightDelimiter,
  patternFlags = ''
) {
  return new RegExp(
    `${escapeRegExp(leftDelimiter)}\\s*([^{}]+?)\\s*${escapeRegExp(
      rightDelimiter
    )}`,
    patternFlags
  )
}

function buildKeyPattern(templateKeys, leftDelimiter, rightDelimiter) {
  // Longest first so that `{name}` can never win against `{nameLong}`.
  const keyAlternation = [...templateKeys]
    .sort((firstKey, secondKey) => secondKey.length - firstKey.length)
    .map(escapeRegExp)
    .join('|')

  return new RegExp(
    `${escapeRegExp(leftDelimiter)}\\s*(${keyAlternation})\\s*${escapeRegExp(
      rightDelimiter
    )}`,
    'g'
  )
}

function renderValue(keyValue) {
  if (keyValue == null) return ''
  if (typeof keyValue === 'object') return JSON.stringify(keyValue)

  return String(keyValue)
}

function escapeRegExp(patternText) {
  return patternText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
