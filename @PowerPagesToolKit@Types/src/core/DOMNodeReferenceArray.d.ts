/// <reference path="../globals.d.ts" />
import type DOMNodeReference from "./DOMNodeReference.d.ts";
export default class DOMNodeReferenceArray extends Array<DOMNodeReference> {
    /**
     * Hides all the containers of the DOMNodeReference instances in the array.
     */
    hideAll(this: DOMNodeReferenceArray): DOMNodeReferenceArray;
    /**
     * Shows all the containers of the DOMNodeReference instances in the array.
     */
    showAll(this: DOMNodeReferenceArray): DOMNodeReferenceArray;
}
