/// <reference path="../globals.d.ts" />
import DOMNodeReferenceArray from "../core/DOMNodeReferenceArray.d.ts";
import type DOMNodeReference from "../core/DOMNodeReference.d.ts";
/**
 *
 * @param array An array of DOMnodeReferences to be modified with custom methods, as well as a custom getter. Custom getter allows for accessing properties within the array with bracket-style property access. See example
 * @example
 * ```javascript
 * const enhanced = enhanceArray(basicArray)
 * const someProp = enhanced['some_prop_logical_name']
 * ```
 */
export default function enhanceArray<T extends string>(array: DOMNodeReference[]): DOMNodeReferenceArray & Record<T, DOMNodeReference>;
