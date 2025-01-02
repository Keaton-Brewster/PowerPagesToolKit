/**
 *
 * @param target basic querySelector syntax to select an element
 * @param root optional parameter to replace document as the root from which to perform the node search
 * @returns
 */
export default function waitFor(
  target: HTMLElement | string,
  root: HTMLElement | Document = document
): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    // Create observer to watch for target in DOM
    const observer = new MutationObserver(() => {
      const observedElement = <HTMLElement>root.querySelector(<string>target);
      if (observedElement) {
        clearTimeout(timeout);
        observer.disconnect();
        resolve(observedElement);
      }
    });
    const timeout = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element not found: ${target} within 5 seconds`));
    }, 5000);

    // Check if target is already in DOM
    if (target instanceof HTMLElement) {
      clearTimeout(timeout);
      return resolve(target);
    }
    const element = <HTMLElement>root.querySelector(target);
    if (element) {
      clearTimeout(timeout);
      return resolve(element);
    }

    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      childList: true, // Detects added/removed child elements
    });
  });
}
