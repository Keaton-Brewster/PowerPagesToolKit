/// <reference path="../globals.d.ts" />
import type DOMNodeReference from "../core/DOMNodeReference.d.ts";
export default abstract class ReferenceManager {
    static instances: Set<DOMNodeReference>;
    static getInstance<T>(target: T): DOMNodeReference | undefined;
}
