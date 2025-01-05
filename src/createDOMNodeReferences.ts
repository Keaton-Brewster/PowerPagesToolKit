import DOMNodeReference, { _init } from "./DOMNodeReference.js";
import waitFor from "./waitFor.js";

// Add function overloads to clearly specify return types based on the 'multiple' parameter
export default async function createDOMNodeReference(
  target: HTMLElement | string,
  multiple: true | (() => true),
  options?: {
    root?: HTMLElement;
    timeout?: number;
  }
): Promise<DOMNodeReference[]>;

export default async function createDOMNodeReference(
  target: HTMLElement | string,
  multiple?: false | (() => false),
  options?: {
    root?: HTMLElement;
    timeout?: number;
  }
): Promise<DOMNodeReference>;

/**
 * Creates and initializes a DOMNodeReference instance.
 * @async
 * @param  target - The CSS selector for the desired DOM element, or, optionally, the element itself for which to create a DOMNodeReference.
 * @param multiple - Should this call return an array of instantiated references, or just a single? Defaults to false, returning a single instance
 * @param root - Optionally specify the element within to search for the element targeted by 'target'. Defaults to 'document.body'
 * @param timeout - Optionally specify the amount of time that should be waited to find the targeted element before throwing error - useful for async DOM loading. Relies on MutationObserver.  WARNING: Implementing multiple references with timeout can results in infinite loading.
 * @returns  A promise that resolves to a Proxy of the initialized DOMNodeReference instance.
 */
export default async function createDOMNodeReference(
  target: HTMLElement | string,
  multiple: (() => boolean) | boolean = false,
  options: {
    root?: HTMLElement;
    timeout?: number;
  } = {
    root: document.body,
    timeout: 0,
  }
): Promise<DOMNodeReference | DOMNodeReference[]> {
  const { root = document.body, timeout = 0 } = options;
  try {
    // Evaluate multiple parameter once at the start
    const isMultiple = typeof multiple === "function" ? multiple() : multiple;

    if (isMultiple) {
      if (typeof target !== "string") {
        throw new Error(
          `'target' must be of type 'string' if 'multiple' is set to 'true'. Received type: '${typeof target}'`
        );
      }

      const elements = <HTMLElement[]>(
        await waitFor(target, root, true, timeout)
      );

      // Avoid recursive call with multiple flag for better performance
      const initializedElements = <DOMNodeReference[]>await Promise.all(
        elements.map(async (element) => {
          const instance = new DOMNodeReference(element);
          await instance[_init]();
          return new Proxy(instance, createProxyHandler());
        })
      );
      return enhanceArray(initializedElements);
    }

    const instance = new DOMNodeReference(target, root, timeout);
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
function enhanceArray(array: DOMNodeReference[]): DOMNodeReference[] {
  Object.defineProperties(array, {
    hideAll: {
      value: function (this: DOMNodeReference[]) {
        this.forEach((instance: DOMNodeReference) => instance.hide());
        return this;
      },
    },
    showAll: {
      value: function (this: DOMNodeReference[]) {
        this.forEach((instance: DOMNodeReference) => instance.show());
        return this;
      },
    },
  });

  return array as DOMNodeReference[];
}
