import { DOMNodeReferenceArray } from "./DOMNodeReferenceArray.js";
import DOMNodeReference, { _init } from "./DOMNodeReference.js";
import waitFor from "./waitFor.js";

interface CreationOptions {
  /**
   * Should this call return an array of instantiated references, or just a single?
   * Defaults to false, returning a single instance.
   */
  multiple?: (() => boolean) | boolean;

  /**
   * Optionally specify the element within which to search for the element targeted by 'target'.
   * Defaults to 'document.body'.
   */
  root?: HTMLElement;

  /**
   * Optionally specify the amount of time that should be waited to find the targeted element before throwing an error.
   * Useful for async DOM loading. Relies on MutationObserver.
   * WARNING: Implementing multiple references with timeout can result in infinite loading.
   */
  timeout?: number;
}

// Add function overloads to clearly specify return types based on the 'multiple' parameter
export default async function createDOMNodeReference(
  target: Element,
  options?: CreationOptions
): Promise<DOMNodeReference>;

export default async function createDOMNodeReference(
  target: string,
  options?: Omit<CreationOptions, "multiple"> & {
    /**
     * Should this call return an array of instantiated references, or just a single instance?
     * Defaults to false, returning a single instance.
     */
    multiple?: false;
  }
): Promise<DOMNodeReference>;

export default async function createDOMNodeReference(
  target: string,
  options?: Omit<CreationOptions, "multiple"> & {
    /**
     * Should this call return an array of instantiated references, or just a single instance?
     * Defaults to false, returning a single instance.
     */
    multiple?: true;
  }
): Promise<DOMNodeReferenceArray>;

/**
 * Creates and initializes a DOMNodeReference instance.
 * @async
 * @param  target The CSS selector for the desired DOM element, or, optionally, the element itself for which to create a DOMNodeReference.
 * @param options Options for advanced retrieval of elements
 * @returns  A promise that resolves to a Proxy of the initialized DOMNodeReference instance.
 */
export default async function createDOMNodeReference(
  target: Element | string,
  /**
   * @property multiple - Should this call return an array of instantiated references, or just a single? Defaults to false, returning a single instance
   * @property root - Optionally specify the element within to search for the element targeted by 'target'. Defaults to 'document.body'
   * @property timeout - Optionally specify the amount of time that should be waited to find the targeted element before throwing error - useful for async DOM loading. Relies on MutationObserver.  WARNING: Implementing multiple references with timeout can results in infinite loading.
   */
  options: CreationOptions = {
    multiple: false,
    root: document.body,
    timeout: 0,
  }
): Promise<DOMNodeReference | DOMNodeReferenceArray> {
  try {
    if (typeof options !== "object") {
      throw new Error(
        `'options' must be of type 'object'. Received type: '${typeof options}'`
      );
    }

    validateOptions(options);
    const { multiple = false, root = document.body, timeout = 0 } = options;

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
      const initializedElements = <DOMNodeReferenceArray>await Promise.all(
        elements.map(async (element) => {
          const instance = new DOMNodeReference(element, root, timeout);
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
    throw new Error(<string>e);
  }
}

function validateOptions(options: any) {
  const { multiple = false, root = document.body, timeout = 0 } = options;
  if (typeof multiple !== "boolean" && typeof multiple !== "function") {
    throw new Error(
      `'multiple' must be of type 'boolean' or 'function'. Received type: '${typeof multiple}'`
    );
  }
  if (typeof multiple === "function") {
    const value = multiple();
    if (typeof value !== "boolean") {
      throw new Error(
        `'multiple' function must return a boolean. Received type: '${typeof value}'`
      );
    }
  }
  if (!(root instanceof HTMLElement)) {
    throw new Error(
      `'root' must be of type 'HTMLElement'. Received type: '${typeof root}'`
    );
  }
  if (typeof timeout !== "number") {
    throw new Error(
      `'timeout' must be of type 'number'. Received type: '${typeof timeout}'`
    );
  }
  return;
}

// Separate proxy handler for reusability
function createProxyHandler() {
  return {
    get: (target: DOMNodeReference, prop: string | symbol) => {
      if (prop.toString().startsWith("_")) return undefined;

      const value = target[<keyof DOMNodeReference>prop];
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
export function enhanceArray(
  array: DOMNodeReferenceArray
): DOMNodeReferenceArray {
  // Object.defineProperties(array, {
  //   hideAll: {
  //     value: function (this: DOMNodeReferenceArray) {
  //       this.forEach((instance: DOMNodeReference) => instance.hide());
  //       return this;
  //     },
  //   },
  //   showAll: {
  //     value: function (this: DOMNodeReferenceArray) {
  //       this.forEach((instance: DOMNodeReference) => instance.show());
  //       return this;
  //     },
  //   },
  // });

  array = new DOMNodeReferenceArray(...array);

  // return <DOMNodeReferenceArray>array;
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
