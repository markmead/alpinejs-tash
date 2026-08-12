const DEFAULT_DELIMITERS = ['{', '}']

// Alpine owns these attributes and treats their values as expressions, not as
// text, so interpolating into them would corrupt the expression.
const ALPINE_ATTRIBUTE_PATTERN = /^(x-|@|:)/

const SKIPPED_TAGS = ['SCRIPT', 'STYLE', 'TEMPLATE']

// Usable either as a plugin directly, `Alpine.plugin(tash)`, or as a factory
// taking options, `Alpine.plugin(tash({ delimiters: ['[[', ']]'] }))`.
export default function tash(alpineOrOptions) {
  if (isAlpineInstance(alpineOrOptions)) return registerDirective(alpineOrOptions)

  return (Alpine) => registerDirective(Alpine, alpineOrOptions)
}

function isAlpineInstance(candidate) {
  return typeof candidate?.directive === 'function'
}

function registerDirective(Alpine, pluginOptions = {}) {
  const [leftDelimiter, rightDelimiter] = resolveDelimiters(
    pluginOptions.delimiters
  )

  // `matchAll` and `replace` both handle `lastIndex` safely; `test` does not,
  // so it gets its own non-global copy.
  const placeholderPattern = buildPlaceholderPattern(
    leftDelimiter,
    rightDelimiter,
    'g'
  )
  const placeholderTest = buildPlaceholderPattern(leftDelimiter, rightDelimiter)

  Alpine.directive('tash', (hostEl, { expression }, { effect, cleanup }) => {
    const listedKeys = expression.trim()
      ? expression
          .split(',')
          .map((listedKey) => listedKey.trim())
          .filter(Boolean)
      : null

    // A node moved by x-for is reported as newly added again. Without this its
    // already-rendered text would be captured as a fresh template.
    const boundTextNodes = new WeakSet()
    const boundAttributes = new WeakMap()

    const bindingContext = {
      Alpine,
      hostEl,
      listedKeys,
      placeholderPattern,
      placeholderTest,
      leftDelimiter,
      rightDelimiter,
      boundTextNodes,
      boundAttributes,
    }

    bindSubtree(hostEl)

    // x-for and x-if insert their content after this directive has run, so new
    // nodes are bound as they arrive. Only childList is observed: rendering
    // writes `nodeValue` and attributes, neither of which re-triggers this.
    const domObserver = new MutationObserver((mutationList) => {
      for (const mutation of mutationList) {
        for (const addedNode of mutation.addedNodes) bindSubtree(addedNode)
      }
    })

    domObserver.observe(hostEl, { childList: true, subtree: true })

    cleanup(() => domObserver.disconnect())

    function bindSubtree(rootNode) {
      const newBindings = collectBindings(rootNode, bindingContext)

      if (!newBindings.length) return

      // One effect per batch, rather than per binding, so a churning x-for does
      // not accumulate an effect for every row it has ever rendered.
      effect(() => {
        for (let index = newBindings.length - 1; index >= 0; index--) {
          const nodeBinding = newBindings[index]

          if (!nodeBinding.ownerEl.isConnected) {
            newBindings.splice(index, 1)

            continue
          }

          renderBinding(nodeBinding, placeholderPattern)
        }
      })
    }
  })
}

function renderBinding(nodeBinding, placeholderPattern) {
  const keyValues = new Map()

  // Alpine catches expression errors internally and simply never calls the
  // callback, so a key that cannot resolve is absent here rather than throwing.
  // Evaluating per key is what keeps one bad key from blanking the element.
  for (const [templateKey, evaluateKey] of nodeBinding.keyEvaluators) {
    evaluateKey((keyValue) => keyValues.set(templateKey, keyValue))
  }

  nodeBinding.renderInto(
    nodeBinding.templateText.replace(
      placeholderPattern,
      (matchedText, matchedKey) =>
        keyValues.has(matchedKey)
          ? renderValue(keyValues.get(matchedKey))
          : matchedText
    )
  )
}

function collectBindings(rootNode, bindingContext) {
  const nodeBindings = []

  if (rootNode.nodeType === Node.TEXT_NODE) {
    addTextBinding(rootNode, bindingContext, nodeBindings)

    return nodeBindings
  }

  if (rootNode.nodeType !== Node.ELEMENT_NODE) return nodeBindings
  if (isSkippedElement(rootNode, bindingContext)) return nodeBindings

  // The walker never yields its own root, so the root's attributes are
  // collected separately.
  addAttributeBindings(rootNode, bindingContext, nodeBindings)

  const treeWalker = document.createTreeWalker(
    rootNode,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    {
      acceptNode(visitedNode) {
        return visitedNode.nodeType === Node.ELEMENT_NODE &&
          isSkippedElement(visitedNode, bindingContext)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT
      },
    }
  )

  while (treeWalker.nextNode()) {
    const currentNode = treeWalker.currentNode

    if (currentNode.nodeType === Node.ELEMENT_NODE) {
      addAttributeBindings(currentNode, bindingContext, nodeBindings)

      continue
    }

    addTextBinding(currentNode, bindingContext, nodeBindings)
  }

  return nodeBindings
}

// A nested x-tash owns its own subtree, and would otherwise render twice.
// Template content is bound through the clones x-for and x-if insert.
function isSkippedElement(targetEl, { hostEl }) {
  if (targetEl === hostEl) return false

  return targetEl.hasAttribute('x-tash') || SKIPPED_TAGS.includes(targetEl.tagName)
}

function addTextBinding(textNode, bindingContext, nodeBindings) {
  const { placeholderTest, boundTextNodes } = bindingContext

  if (boundTextNodes.has(textNode)) return
  if (!placeholderTest.test(textNode.nodeValue)) return

  const nodeBinding = createBinding(
    textNode.nodeValue,
    textNode.parentElement,
    bindingContext,
    (renderedText) => {
      if (textNode.nodeValue !== renderedText) textNode.nodeValue = renderedText
    }
  )

  if (!nodeBinding) return

  boundTextNodes.add(textNode)
  nodeBindings.push(nodeBinding)
}

function addAttributeBindings(targetEl, bindingContext, nodeBindings) {
  const { placeholderTest, boundAttributes } = bindingContext

  for (const { name, value } of targetEl.attributes) {
    if (ALPINE_ATTRIBUTE_PATTERN.test(name)) continue
    if (boundAttributes.get(targetEl)?.has(name)) continue
    if (!placeholderTest.test(value)) continue

    const nodeBinding = createBinding(
      value,
      targetEl,
      bindingContext,
      (renderedText) => {
        if (targetEl.getAttribute(name) !== renderedText)
          targetEl.setAttribute(name, renderedText)
      }
    )

    if (!nodeBinding) continue

    if (!boundAttributes.has(targetEl)) boundAttributes.set(targetEl, new Set())

    boundAttributes.get(targetEl).add(name)
    nodeBindings.push(nodeBinding)
  }
}

function createBinding(templateText, ownerEl, bindingContext, renderInto) {
  const { Alpine, listedKeys } = bindingContext

  if (!ownerEl) return null

  const templateKeys = listedKeys ?? findTemplateKeys(templateText, bindingContext)

  if (!templateKeys.length) return null

  // Evaluators are compiled against the node's own element, so a key inside an
  // x-for body resolves against the loop scope rather than the host element.
  const keyEvaluators = templateKeys.map((templateKey) => [
    templateKey,
    Alpine.evaluateLater(ownerEl, `(${templateKey})`),
  ])

  return { templateText, ownerEl, keyEvaluators, renderInto }
}

function findTemplateKeys(templateText, bindingContext) {
  const { placeholderPattern, leftDelimiter, rightDelimiter } = bindingContext
  const templateKeys = new Set()

  for (const [, matchedKey] of templateText.matchAll(placeholderPattern)) {
    // An unbalanced `{a {b}` captures `a {b`. Treat that as literal text rather
    // than handing Alpine an expression it will only fail on.
    if (matchedKey.includes(leftDelimiter) || matchedKey.includes(rightDelimiter))
      continue

    templateKeys.add(matchedKey)
  }

  return [...templateKeys]
}

function resolveDelimiters(configuredDelimiters) {
  if (configuredDelimiters === undefined) return DEFAULT_DELIMITERS

  const isValidPair =
    Array.isArray(configuredDelimiters) &&
    configuredDelimiters.length === 2 &&
    configuredDelimiters.every(
      (delimiter) => typeof delimiter === 'string' && delimiter.length > 0
    )

  if (!isValidPair)
    throw new Error(
      `alpinejs-tash: expected delimiters to be a pair of non-empty strings like ['[[', ']]'], received ${JSON.stringify(
        configuredDelimiters
      )}`
    )

  return configuredDelimiters
}

function buildPlaceholderPattern(
  leftDelimiter,
  rightDelimiter,
  patternFlags = ''
) {
  return new RegExp(
    `${escapeRegExp(leftDelimiter)}\\s*([\\s\\S]+?)\\s*${escapeRegExp(
      rightDelimiter
    )}`,
    patternFlags
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
