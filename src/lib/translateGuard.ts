// Keeping the app alive under Google Translate (02/11/2026).
//
// THE PROBLEM. Chrome's automatic translation rewrites the page's text
// nodes, wrapping them in its own elements. React still holds references to
// the nodes it created, so the next render calls removeChild or insertBefore
// against a parent that no longer owns them, the DOM throws, and the whole
// page dies with "Failed to execute 'insertBefore' on 'Node'". It took down
// My Business Page for a member reading the site in Portuguese.
//
// WHY THIS, AND NOT SOMETHING CLEANER. The honest fixes are both worse here:
// turning translation off site-wide (one line, total fix) would take
// automatic Portuguese away from the many Brazilian members reading a site
// written in English; wrapping every bare text node in an element is the
// "correct" repair but means hundreds of places, and any new text brings the
// crash back. So we make the impossible operation a no-op instead of a
// crash — which is what most React apps in production do, because the
// conflict has no clean fix on React's side.
//
// WHAT IT COSTS. The guard only fires in a case that was already broken: the
// node is not where React believes it is. Swallowing it can leave that
// translated fragment stale until the next render touches it. A stale line
// beats a blank page. Everything outside that case runs untouched, because
// the original method is called whenever the parent is right.
//
// WHEN TO DELETE THIS. The day the site has real Portuguese instead of
// machine translation, automatic translation stops being needed: set
// translate="no" on the document and remove this file.

let warned = false

function warnOnce(what: string) {
  if (warned) return
  warned = true
  // One line, not one per node: a translated page can hit this many times
  // in a row, and a flooded console hides whatever else is wrong.
  console.warn(
    `[translateGuard] The page is being translated by the browser, so React lost track of some nodes (${what}). ` +
      'The operation was skipped instead of crashing the page.',
  )
}

export function installTranslateGuard() {
  if (typeof Node !== 'function' || !Node.prototype) return

  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function removeChild<T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      warnOnce('removeChild')
      return child
    }
    return originalRemoveChild.call(this, child) as T
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function insertBefore<T extends Node>(this: Node, node: T, child: Node | null): T {
    if (child && child.parentNode !== this) {
      warnOnce('insertBefore')
      return node
    }
    return originalInsertBefore.call(this, node, child) as T
  }
}
