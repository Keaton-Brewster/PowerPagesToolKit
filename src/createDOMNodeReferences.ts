import DOMNodeReference, { _initSymbol } from "./DOMNodeReference.js";

/**
 * Creates and initializes a DOMNodeReference instance.
 * @async
 * @param {string | HTMLElement} target - The CSS selector for the desired DOM element, or, optionally, the element itself for which to create a DOMNodeReference.
 * @returns {Promise<DOMNodeReference>} A promise that resolves to a Proxy of the initialized DOMNodeReference instance.
 */
export async function createDOMNodeReference(
  target: HTMLElement | string
): Promise<DOMNodeReference> {
  try {
    const instance = new DOMNodeReference(target);
    await instance[_initSymbol]();

    return new Proxy(instance, {
      get: (target, prop) => {
        // do not proxy the initialization method
        // init() is only needed in this factory function
        if (prop.toString().startsWith("_")) return undefined;

        // proxy the class to wrap all methods in the 'onceLoaded' method, to make sure the
        // element is always available before executing method
        const value = target[prop as keyof DOMNodeReference];
        if (typeof value === "function" && prop !== "onceLoaded") {
          return (...args: any[]) => {
            target.onceLoaded(() => value.apply(target, args));
            return target;
          };
        }
        return value;
      },
    });
  } catch (e) {
    throw new Error(e as string);
  }
}

/**
 * Creates and initializes multiple DOMNodeReference instances.
 * @async
 * @param {string} querySelector - The CSS selector for the desired DOM elements.
 * @returns {Promise<DOMNodeReference[]>} A promise that resolves to an array of Proxies of initialized DOMNodeReference instances.
 */
export async function createMultipleDOMNodeReferences(
  querySelector: string
): Promise<DOMNodeReference[]> {
  try {
    const elements = Array.from(
      document.querySelectorAll(querySelector)
    ) as HTMLElement[];

    const initializedElements = await Promise.all(
      elements.map((element) => createDOMNodeReference(element))
    );

    const domNodeArray = initializedElements as DOMNodeReferenceArray;

    domNodeArray.hideAll = () =>
      domNodeArray.forEach((instance) => instance.hide());
    domNodeArray.showAll = () =>
      domNodeArray.forEach((instance) => instance.show());

    return domNodeArray;
  } catch (e) {
    console.error(
      `There was an error creating multiple DOMNodeReferences: ${e}`
    );
    throw new Error(e as string);
  }
}
