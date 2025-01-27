import DOMNodeReference from "@/core/DOMNodeReference.js";
import DOMNodeReferenceArray from "@/core/DOMNodeReferenceArray.js";

// Separate array enhancement for cleaner code
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
