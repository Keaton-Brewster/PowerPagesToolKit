/**
 * @description a function that will wait for a targeted element to appear in the DOM, and then resolve a promise to allow further action to be performed after the targeted elements appears
 * @param {String} selector a query selector expression to target a specific element that you want to appear in the DOM before taking further action
 * @returns {Promise} the element targeted by ID *selector*
 */

export default function waitFor(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      subtree: true,
      attributes: true,
    });
  });
}
