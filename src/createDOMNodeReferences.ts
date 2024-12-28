import DOMNodeReference, { _init } from "./DOMNodeReference.js";

/**
 * Creates and initializes a DOMNodeReference instance.
 * @async
 * @param  target - The CSS selector for the desired DOM element, or, optionally, the element itself for which to create a DOMNodeReference.
 * @param multiple Should this call return an array of instantiated references, or just a single? Defaults to false, returning a single instance
 * @returns  A promise that resolves to a Proxy of the initialized DOMNodeReference instance.
 */
export default async function createDOMNodeReference(
  target: HTMLElement | string,
  multiple: (() => boolean) | boolean = false
): Promise<DOMNodeReference | DOMNodeReferenceArray> {
  try {
    // Evaluate multiple parameter once at the start
    const isMultiple = typeof multiple === "function" ? multiple() : multiple;

    if (isMultiple) {
      if (typeof target !== "string") {
        throw new Error(
          `'target' must be of type 'string' if 'multiple' is set to 'true'. Received type: '${typeof target}'`
        );
      }

      const elements = Array.from(
        document.querySelectorAll(target)
      ) as HTMLElement[];

      // Avoid recursive call with multiple flag for better performance
      const initializedElements = await Promise.all(
        elements.map(async (element) => {
          const instance = new DOMNodeReference(element);
          await instance[_init]();
          return new Proxy(instance, createProxyHandler());
        })
      );

      return enhanceArray(initializedElements);
    }

    const instance = new DOMNodeReference(target);
    await instance[_init]();
    return new Proxy(instance, createProxyHandler());
  } catch (e) {
    throw new Error(e as string);
  }
}

// Separate proxy handler for reusability
function createProxyHandler() {
  return {
    get: (target: DOMNodeReference, prop: string | symbol) => {
      if (prop.toString().startsWith("_")) return undefined;

      const value = target[prop as keyof DOMNodeReference];
      if (typeof value === "function" && prop !== "onceLoaded") {
        return (...args: any[]) => {
          target.onceLoaded(() => value.apply(target, args));
          return target;
        };
      }
      return value;
    },
  };
}

// Separate array enhancement for cleaner code
function enhanceArray(array: DOMNodeReference[]): DOMNodeReferenceArray {
  const enhanced = array as DOMNodeReferenceArray;
  enhanced.hideAll = () => enhanced.forEach((instance) => instance.hide());
  enhanced.showAll = () => enhanced.forEach((instance) => instance.show());
  return enhanced;
}
