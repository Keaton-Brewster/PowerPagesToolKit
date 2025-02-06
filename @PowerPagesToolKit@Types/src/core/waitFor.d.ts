/// <reference path="../globals.d.ts" />
/**
 * Provides an async way to capture DOM elements; for when querySelector cannot capture the target due to async DOM content loading
 * @param **target** - basic querySelector syntax to select an element
 * @param **root** - optional parameter to replace document as the root from which to perform the node search
 * @returns the element(s) targeted by the `querySelector` string
 */
export default function waitFor(target: string, root: Element | Document, multiple: false, debounceTime: number): Promise<HTMLElement>;
export default function waitFor(target: string, root: Element | Document, multiple: true, debounceTime: number): Promise<HTMLElement[]>;
