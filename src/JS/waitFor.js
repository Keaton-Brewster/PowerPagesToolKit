/**
 * @description a function that will wait for a targeted element to appear in the DOM, and then resolve a promise to allow further action to be performed after the targeted elements appears
 * @param {String} target a query target expression to target a specific element that you want to appear in the DOM before taking further action
 * @returns {Promise} the element targeted by ID *target*
 */

export default function waitFor(target) {
  return new Promise((resolve) => {
    if (target instanceof HTMLElement) {
      return resolve(target);
    }
    if (document.querySelector(target)) {
      return resolve(document.querySelector(target));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(target)) {
        observer.disconnect();
        resolve(document.querySelector(target));
      }
    });

    observer.observe(document.body, {
      subtree: true,
      attributes: true,
    });
  });
}
