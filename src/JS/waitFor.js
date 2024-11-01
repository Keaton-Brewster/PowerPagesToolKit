export default function waitFor(target) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element not found: ${target} within 5 seconds`));
    }, 5000);

    // Check if target is already in DOM
    if (target instanceof HTMLElement) {
      clearTimeout(timeout);
      return resolve(target);
    }
    const element = document.querySelector(target);
    if (element) {
      clearTimeout(timeout);
      return resolve(element);
    }

    // Create observer to watch for target in DOM
    const observer = new MutationObserver(() => {
      const observedElement = document.querySelector(target);
      if (observedElement) {
        clearTimeout(timeout);
        observer.disconnect();
        resolve(observedElement);
      }
    });

    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      childList: true, // Detects added/removed child elements
    });
  });
}
