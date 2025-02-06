/// <reference path="../globals.d.ts" />
import DOMNodeReference from "./DOMNodeReference.d.ts";
import type DOMNodeReferenceArray from "./DOMNodeReferenceArray.d.ts";
/**
 * Creates and initializes a DOMNodeReference instance.
 * @see {@link CreationOptions}
 * @param  **target** - The selector, using `querySelector` syntax, for the desired DOM element. Or, the `HTMLElement` itself for which to create a DOMNodeReference.
 * @param **options** - Options for advanced retrieval of elements
 * @param **options.multiple** - Should this call return an array of instantiated references, or just a single? Defaults to false, returning a single instance
 * @param **options.root** - Optionally specify the element within to search for the element targeted by 'target'. Defaults to `document.body`
 * @param **options.timeoutMs** - Optionally specify the amount of time that should be waited to find the targeted element before throwing error - useful for async DOM loading. Relies on MutationObserver.  ***WARNING***: Implementing multiple references with timeout can result in infinite loading.
 * @returns  A promise that resolves to a Proxy of the initialized DOMNodeReference instance.
 *
 * @see {@link DOMNodeReference}
 * @see {@link DOMNodeReferenceArray}
 * @see {@link enhanceArray}
 */
export default function createDOMNodeReference(target: string | HTMLElement, options?: {
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
}): Promise<DOMNodeReference>;
export default function createDOMNodeReference(target: string, options?: {
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
}): Promise<DOMNodeReference>;
export default function createDOMNodeReference(target: Element, options?: {
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
}): Promise<DOMNodeReference>;
export default function createDOMNodeReference(target: string, options?: {
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
}): Promise<DOMNodeReferenceArray>;
export declare function validateOptions(options: Partial<CreationOptions>): void;
export declare function createProxyHandler(): {
    get: (target: DOMNodeReference, prop: string | symbol) => any;
};
