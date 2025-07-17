/* contents.js
 * Generate tables of contents.
 *
 * Usage:
 *
 *    <script type="module" src="contents.js"></script>
 *    <aside id="contents-js"></aside>
 *
 * Limit scope of the contents to the document/article area:
 *
 *    <aside id="contents-js" data-contentsjs-scope=".post-content"></aside>
 *
 * Specify which elements can be jumped to:
 *
 *   <aside id="contents-js" data-contentsjs-jump=":in(h1, h2, dt)"></aside>
 *
 */

const CONTENTS_DEBUG = false;

function debug(...args) {
  if (CONTENTS_DEBUG) {
    console.log('contents: ', ...args);
  }
}

///////////////////////////////////////////////////////////////////////////////

// Slugify saves previous results to slugify.history
function slugify(str) {
  slugify.history = slugify.history || [];
  const slug = 'jumpto-' + str
    .trim()
    .toLowerCase()
    .replace(/[\s\W-]+/g, '-') // replace spaces and non-word chars with dashes
    .replace(/^-+|-+$/g, '');  // remove leading/trailing dashes
  var suffix = ''
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

///////////////////////////////////////////////////////////////////////////////

// A Target has a tag, a label and a slugified name (derived from that label)
function asTarget(element) {
  const label = element.textContent.trim();
  const target = new Map();
  target.set('label', label);
  target.set('name', slugify(label));
  target.set('tag', element.tagName.toLowerCase());
  return target;
}

// An Anchor is an empty <a> tag with a name attribute
function asAnchor(target) {
  const a = document.createElement('a');
  a.name = target.get('name');
  return a;
}

// A Link element is a labelled <a> tag with an href attribute
function asLink(target) {
  const a = document.createElement('a');
  a.href = `#${target.get('name')}`;
  a.textContent = target.get('label');
  return a
}

// Used for human-readable output, e.g. <h2>Title</h2>
function asTag(target) {
  return `<${target.get('tag')}>${target.get('label')}</${target.get('tag')}>`;
}

///////////////////////////////////////////////////////////////////////////////

// Returns a nested list of links according to the targets array.
function contentsUl(targets) {
  debug('contentsUl', targets.map(t => t.get('name')));
  var completed = 0;
  function getLevel(target) {
    return target.get('tag').toLowerCase();
  }
  function indexLevel(index) {
    return getLevel(targets[index]);
  }
  function contentsList(ul, level=getLevel(targets[0])) {
    for (let i = completed; i < targets.length; i++) {
      debug(`contentsList level: ${level} completed: ${completed} at: ${i}/${targets.length}`);
      completed = i;
      const target = targets[i];
      const targetLevel = getLevel(target);
      if (targetLevel === level) {
        // Same level, add as a list item
        const li = document.createElement('li');
        li.appendChild(asLink(target));
        ul.appendChild(li);

      } else if (targetLevel > level) {
        const subList = contentsList(document.createElement('ul'), targetLevel);
        const li = document.createElement('li');
        li.appendChild(subList);
	      li.style.listStyleType = 'none';
        ul.appendChild(li);
        i = completed;
      } else {
        break;
      }
    }
    return ul;
  }
  return contentsList(document.createElement('ul'));
}

// Injects anchor tags before selected elements. Returns an asTarget array.
function injectAnchors(selector) {
  debug('injectAnchors', selector);
  const targets = [];
  document.querySelectorAll(selector).forEach(element => {
    const target = asTarget(element);
    element.before(asAnchor(target));
    targets.push(target);
  });
  return targets;
}

// injectsAnchors & appends a contentsUl to the contents element
function initContents(selector='aside#contents-js') {
  debug('initContents', selector);
  const contents = document.querySelector(selector);
  if (!contents) {
    debug(`No contents element selected with "${selector}"`);
    return null;
  }
  const scopeSelector = contents.dataset.contentsjsScope || '.post-content';
  const jumpSelector = contents.dataset.contentsjsJump || ':is(h1,h2,h3,h4,h5,h6)';
  const targetSelector = `${scopeSelector} ${jumpSelector}`;
  const targets = injectAnchors(targetSelector);
  contents.appendChild(contentsUl(targets));
}

document.addEventListener('DOMContentLoaded', () => {
  debug('DOMContentLoaded');
  initContents();
});
