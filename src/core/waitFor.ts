/**
 * @module waitFor
 * Provides an async way to capture DOM elements; for when querySelector cannot capture the target due to async DOM content loading
 */

export default function waitFor(
  target: Element | string,
  root: Element | Document,
  multiple: false,
  debounceTime: number
): Promise<HTMLElement>;

export default function waitFor(
  target: Element | string,
  root: Element | Document,
  multiple: true,
  debounceTime: number
): Promise<HTMLElement[]>;

/**
 *
 * @param target basic querySelector syntax to select an element
 * @param root optional parameter to replace document as the root from which to perform the node search
 * @returns
 */
export default function waitFor(
  target: Element | string,
  root: Element | Document = document,
  multiple: boolean = false,
  debounceTime: number
): Promise<HTMLElement | HTMLElement[]> {
  //
  return new Promise((resolve, reject) => {
    //
    if (multiple) {
      //
      let timeout: any;
      const observedElements: HTMLElement[] = [];
      const observedSet: Set<HTMLElement> = new Set();

      if (debounceTime < 1) {
        return resolve(
          <HTMLElement[]>Array.from(root.querySelectorAll(<string>target))
        );
      }
      const observer = new MutationObserver(() => {
        const found = <HTMLElement[]>(
          Array.from(root.querySelectorAll(<string>target))
        );

        // If elements are found, store them in observedElements
        found.forEach((element) => {
          if (!observedSet.has(element)) {
            observedSet.add(element);
            observedElements.push(element);
          }
        });

        // Clear the previous timeout and set a new one
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          // Resolve the promise after debounce period if no more mutations
          if (observedElements.length > 0) {
            observer.disconnect();
            resolve(observedElements);
          } else {
            reject(
              new Error(
                `No elements found with target: "${target}" within ${
                  debounceTime / 1000
                } seconds. If the element you are expecting has not loaded yet, consider raising your timeout.`
              )
            );
          }
        }, debounceTime);
      });

      observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: false,
      });
      //
    } else {
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
        reject(
          new Error(
            `Element not found by target: "${target}" within ${
              debounceTime / 1000
            } second. If the element you are expecting has not loaded yet, consider raising your timeout.`
          )
        );
      }, debounceTime);

      // Check if target is already in DOM
      if (target instanceof HTMLElement) {
        clearTimeout(timeout);
        return resolve(target);
      }
      const element = <HTMLElement>root.querySelector(<string>target);
      if (element) {
        clearTimeout(timeout);
        return resolve(element);
      }

      observer.observe(root, {
        subtree: true,
        attributes: true,
        childList: true, // Detects added/removed child elements
      });
      //
    }
    //
  });
  //
}
