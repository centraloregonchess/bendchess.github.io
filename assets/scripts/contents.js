/**
 * contents.js — Builds a hyper-linked table-of-contents from HTML headings.
 *
 * Usage:
 *   <script type="module" src="contents.js" data-contentsjs></script>
 *   <aside data-contentsjs></aside>
 *
 * Configuration via data attributes:
 *   data-debug  - Boolean to enable logging (set on the <script> element)
 *   data-prefix - Prefix for generated IDs (default: "jumpto-")
 *   data-scope  - CSS selector to scope search (default: "body")
 *   data-tags   - Comma-separated tags (default: "h1,h2,h3,h4,h5,h6")
 *
 * Use data attributes on the <script> for global defaults, or on each wrapper
 * element to override.
 */

const ContentsJsSelector = 'script[type="module"][data-contentsjs]';
const ContentsJs = document.querySelector(ContentsJsSelector);
const ContentsJsDebug = ContentsJs ? 'debug' in ContentsJs.dataset : false;
const ContentsJsPrefix = ContentsJs?.dataset?.prefix ?? 'jumpto-';
const ContentsJsScope = ContentsJs?.dataset?.scope ?? 'body';
const ContentsJsTags = ContentsJs?.dataset?.tags ?? 'h1,h2,h3,h4,h5,h6';
const ContentsJsSrc = ContentsJs?.getAttribute('src') ?? 'contents.js';

if (!ContentsJs) console.warn('contents.js: Expected 1 element to match selector', ContentsJsSelector, 'but found 0');

const log = (...args) => console.log(ContentsJsSrc, ...args);
const debug = (...args) => ContentsJsDebug ? log('[DEBUG]', ...args) : null;

// Slugify saves previous results to slugify.history (to prevent duplicates)
function slugify(str, prefix) {
  slugify.history = slugify.history || [];
  const slug = prefix + str
    .trim()
    .toLowerCase()
    .replace(/[\s\W-]+/g, '-') // replace spaces and non-word chars with dashes
    .replace(/^-+|-+$/g, '');  // remove leading/trailing dashes
  let suffix = ''
  while (slugify.history.includes(slug + suffix)) {
    if (suffix === '') {
      suffix = '-1';
    } else {
      suffix = suffix.replace(/-(\d+)$/, (_, num) => `-${parseInt(num, 10) + 1}`);
    }
  }
  slugify.history.push(slug + suffix);
  return slug + suffix;
}

// A Target has a tag, a label and a slugified name (derived from that label)
class Target {
  constructor(element, prefix) {
    this.label = element.textContent.trim();
    this.name = slugify(this.label, prefix);
    this.tag = element.tagName.toLowerCase();
    this.element = element;
  }

  // Returns a Target from an HTMLElement (likewise from an Array)
  static from(input) {
    if (Array.isArray(input)) return input.map(e => new Target(e));
    if (input instanceof HTMLElement) return new Target(input);
  }

  // Anchor tags have an id attribute that links can target
  createAnchor() {
    const a = document.createElement('a');
    a.id = this.name;
    return a;
  }

  // Links have an href attribute that identifies the Anchor
  createLink() {
    const a = document.createElement('a');
    a.href = `#${this.name}`;
    a.textContent = this.label;
    return a;
  }

  toString() {
    return `<${this.tag} name="${this.name}">`;
  }
}

// Converts a targetTree into nested HTML elements
function nestedElements(tree, branch='ul', leaf='li', call=(node) => node.createLink()) {
  debug('nestedElements/ tree:', tree, 'branch:', branch, 'leaf:', leaf, 'call:', call);
  const ul = document.createElement(branch);
  for (const node of tree) {
    const li = document.createElement(leaf);
    if (Array.isArray(node)) {
      li.style.listStyleType = 'none';
      li.appendChild(nestedElements(node, branch, leaf, call));
    } else {
      li.appendChild(call(node));
    }
    ul.appendChild(li);
  }
  return ul;
}

// Builds a tree of targets where tags decide depth.
// e.g. Where tags are ['h1', 'h2', 'h3'], h3 is below h2, which is below h1.
function targetTree(targets, tags, parent=null, queue=null, node=null) {
  debug('targetTree/ targets:', targets.length, 'tags:', tags, 'parent:', parent, 'queue:', queue, 'node:', node);
  if (parent == null) parent = -1;
  if (queue == null) queue = Array.from(targets);
  if (node == null) node = [];
  const depth = tags.indexOf(queue[0].tag);
  for(let target = queue[0]; queue.length; target = queue[0]) {
    const targetDepth = tags.indexOf(target.tag);
    debug('\t', 'queue:', queue.length, 'depth:', depth, 'targetDepth:', targetDepth, 'target:', target);
    if (depth < targetDepth) {
      node.push(targetTree(targets, tags, depth, queue));
    } else if (parent < targetDepth) {
      node.push(queue.shift());
    } else {
      break;
    }
  }
  return node;
}

// Inserts anchors before each target & appends a contents list to the wrapper
function initContents(wrapper) {
  debug('initContents/ wrapper:', wrapper);
  const prefix = wrapper?.dataset?.prefix ?? ContentsJsPrefix;
  const scopeSelector = wrapper?.dataset?.scope ?? ContentsJsScope;
  const tagSelector = wrapper?.dataset?.tags ?? ContentsJsTags;
  const tags = tagSelector.split(',').map(tag => tag.trim().toLowerCase());
  const selector = `${scopeSelector} :is(${tagSelector})`;
  const elements = Array.from(document.querySelectorAll(selector));
  const targets = elements.map(e => new Target(e, prefix));
  debug('\t', targets.length, 'targets found using selector:', selector);
  if (!targets.length) return;
  targets.forEach(target => target.element.before(target.createAnchor()));
  const ul = nestedElements(targetTree(targets, tags));
  wrapper.appendChild(ul);
  debug('\t', 'completed initContents/ wrapper:', wrapper);
  return ul;
}

document.addEventListener('DOMContentLoaded', () => {
  const selector = '[data-contentsjs]:not(script)';
  const contents = Array.from(document.querySelectorAll(selector));
  contents.length ? contents.forEach(initContents) : log('No contents element found with selector:', selector);
});
