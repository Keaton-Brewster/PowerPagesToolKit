import DOMNodeReferenceArray from "../core/DOMNodeReferenceArray.ts";
import type DOMNodeReference from "../core/DOMNodeReference.ts";

/**
 *
 * @param array An array of DOMnodeReferences to be modified with custom methods, as well as a custom getter. Custom getter allows for accessing properties within the array with bracket-style property access. See example
 * @example
 * ```javascript
 * const enhanced = enhanceArray(basicArray)
 * const someProp = enhanced['some_prop_logical_name']
 * ```
 */
export default function enhanceArray<T extends string>(
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
