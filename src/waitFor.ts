export default function waitFor(
  target: HTMLElement | string
): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    // Create observer to watch for target in DOM
    const observer = new MutationObserver(() => {
      const observedElement = <HTMLElement>(
        document.querySelector(<string>target)
      );
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
    const element = <HTMLElement>document.querySelector(target);
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
