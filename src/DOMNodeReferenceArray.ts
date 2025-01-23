import DOMNodeReference from "./DOMNodeReference.js";

export class DOMNodeReferenceArray extends Array<DOMNodeReference> {
  /**
   * Hides all the containers of the DOMNodeReference instances in the array.
   */
  hideAll(this: DOMNodeReferenceArray) {
    this.forEach((instance: DOMNodeReference) => instance.hide());
    return this;
  }

  /**
   * Shows all the containers of the DOMNodeReference instances in the array.
   */

  showAll(this: DOMNodeReferenceArray) {
    this.forEach((instance: DOMNodeReference) => instance.show());
    return this;
  }
}

// Separate array enhancement for cleaner code
export function enhanceArray(
  array: DOMNodeReferenceArray
): DOMNodeReferenceArray {
  array = new DOMNodeReferenceArray(...array);

  return new Proxy(array, {
    get(target, prop) {
      if (prop in target) {
        return target[prop as keyof typeof target];
      }
      if (typeof prop === "string") {
        return target.find((instance) => {
          return instance.element.id === prop;
        });
      }

      return undefined;
    },
  });
}
