/// <reference path="../globals.d.ts" />
/**
 * For use in setting up event management in the instances of DOMNodeReference
 * @see {@link DOMNodeReference}
 */
declare const eventMapping: Record<string, keyof HTMLElementEventMap>;
export default eventMapping;
