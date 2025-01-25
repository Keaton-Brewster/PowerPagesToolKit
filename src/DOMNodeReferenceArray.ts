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
export function enhanceArray<T extends string>(
  array: DOMNodeReference[]
): DOMNodeReferenceArray & Record<T, DOMNodeReference> {
  const enhancedArray = new DOMNodeReferenceArray(...array);

  return new Proxy(enhancedArray, {
    get(target, prop: string | symbol, receiver) {
      // Preserve existing array methods
      if (prop in target) {
        return Reflect.get(target, prop, receiver);
      }

      // Ensure `prop` is a string and search by `element.id`
      if (typeof prop === "string") {
        return target.find(
          (instance) =>
            instance.target.toString().replace(/[#\[\]]/g, "") === prop ||
            instance.logicalName === prop
        );
      }

      return undefined;
    },
  }) as DOMNodeReferenceArray & Record<T, DOMNodeReference>;
}
