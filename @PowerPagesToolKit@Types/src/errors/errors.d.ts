/// <reference path="../globals.d.ts" />
import type DOMNodeReference from "../core/DOMNodeReference.d.ts";
export declare class DOMNodeInitializationError extends Error {
    constructor(instance: DOMNodeReference, error: string);
}
export declare class DOMNodeNotFoundError extends Error {
    constructor(instance: DOMNodeReference);
}
export declare class ConditionalRenderingError extends Error {
    constructor(instance: DOMNodeReference, error: string);
}
export declare class ValidationConfigError extends Error {
    constructor(node: DOMNodeReference, message: string);
}
