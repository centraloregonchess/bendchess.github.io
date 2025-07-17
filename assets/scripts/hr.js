/* hr.js
 * Inserts horizontal rules into the document.
 */

const SELECTOR = 'article :is(h2,h3,h4,h5,h6), h2';

function initHorizontalRule(selector) {
  var margin = '';
  document.querySelectorAll(selector).forEach(element => {
    const hr = document.createElement('hr');
    if (margin) {
      hr.style.marginTop = margin;
    } else {
      margin = '3em';
    }
    element.before(hr);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initHorizontalRule(SELECTOR);
});
