import type PowerPagesElementArray from "./PowerPagesElementArray.ts";
import PowerPagesElement from "./PowerPagesElement.ts";
import enhanceArray from "../utils/enhanceArray.ts";
import waitFor from "./waitFor.ts";
import { init } from "../constants/symbols.ts";

// Add function overloads to clearly specify return types based on the 'multiple' parameter
/**
 * Creates and initializes a PowerPagesElement instance.
 * @see {@link CreationOptions}
 * @param  **target** - The selector, using `querySelector` syntax, for the desired DOM element. Or, the `HTMLElement` itself for which to create a PowerPagesElement.
 * @param **options** - Options for advanced retrieval of elements
 * @param **options.multiple** - Should this call return an array of instantiated references, or just a single? Defaults to false, returning a single instance
 * @param **options.root** - Optionally specify the element within to search for the element targeted by 'target'. Defaults to `document.body`
 * @param **options.timeoutMs** - Optionally specify the amount of time that should be waited to find the targeted element before throwing error - useful for async DOM loading. Relies on MutationObserver.  ***WARNING***: Implementing multiple references with timeout can result in infinite loading.
 * @returns  A promise that resolves to a Proxy of the initialized PowerPagesElement instance.
 *
 * @see {@link PowerPagesElement}
 * @see {@link PowerPagesElementArray}
 * @see {@link enhanceArray}
 */
export default async function createPowerPagesElement(
  target: string | HTMLElement,
  options?: {
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
    timeoutMs?: number;
  }
): Promise<PowerPagesElement>;
export default async function createPowerPagesElement(
  target: string,
  options?: {
    /**
     * Should this call return an array of instantiated references, or just a single?
     * Defaults to false, returning a single instance.
     */
    multiple?: false;
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
    timeoutMs?: number;
  }
): Promise<PowerPagesElement>;

export default async function createPowerPagesElement(
  target: Element,
  options?: {
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
    timeoutMs?: number;
  }
): Promise<PowerPagesElement>;

export default async function createPowerPagesElement(
  target: string,
  options?: {
    /**
     * Should this call return an array of instantiated references, or just a single?
     * Defaults to false, returning a single instance.
     */
    multiple?: true;
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
    timeoutMs?: number;
  }
): Promise<PowerPagesElementArray>;

export default async function createPowerPagesElement(
  target: Element | string,
  options: CreationOptions = {
    multiple: false,
    root: document.body,
    timeoutMs: 0,
  }
): Promise<PowerPagesElement | PowerPagesElementArray> {
  if (typeof options !== "object") {
    throw new TypeError(
      `'options' must be of type 'object'. Received type: '${typeof options}'`
    );
  }

  validateOptions(options);
  const { multiple = false, root = document.body, timeoutMs = 0 } = options;

  // Evaluate multiple parameter once at the start
  const isMultiple = typeof multiple === "function" ? multiple() : multiple;

  if (isMultiple) {
    if (typeof target !== "string") {
      throw new TypeError(
        `'target' must be of type 'string' if 'multiple' is set to 'true'. Received type: '${typeof target}'`
      );
    }

    const elements = <HTMLElement[]>(
      await waitFor(target, root, true, timeoutMs)
    );

    // Avoid recursive call with multiple flag for better performance
    const initializedElements = <PowerPagesElementArray>await Promise.all(
      elements.map(async (element) => {
        const instance = new PowerPagesElement(element, root, timeoutMs);
        await instance[init]();
        return new Proxy(instance, createProxyHandler());
      })
    );
    return enhanceArray(initializedElements);
  }

  const instance = new PowerPagesElement(target, root, timeoutMs);
  await instance[init]();
  return new Proxy(instance, createProxyHandler());
}

export function validateOptions(options: Partial<CreationOptions>) {
  const { multiple = false, root = document.body, timeoutMs = 0 } = options;
  if (typeof multiple !== "boolean" && typeof multiple !== "function") {
    throw new TypeError(
      `'multiple' must be of type 'boolean' or 'function'. Received type: '${typeof multiple}'`
    );
  }
  if (typeof multiple === "function") {
    const value = multiple();
    if (typeof value !== "boolean") {
      throw new TypeError(
        `'multiple' function must return a boolean. Received type: '${typeof value}'`
      );
    }
  }
  if (!(root instanceof HTMLElement)) {
    throw new TypeError(
      `'root' must be of type 'HTMLElement'. Received type: '${typeof root}'`
    );
  }
  if (typeof timeoutMs !== "number") {
    throw new TypeError(
      `'timeout' must be of type 'number'. Received type: '${typeof timeoutMs}'`
    );
  }
  return;
}

// Separate proxy handler for reusability
export function createProxyHandler() {
  return {
    get: (target: PowerPagesElement, prop: string | symbol) => {
      if (prop.toString().startsWith("_")) return undefined;

      const value = target[<keyof PowerPagesElement>prop];
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
