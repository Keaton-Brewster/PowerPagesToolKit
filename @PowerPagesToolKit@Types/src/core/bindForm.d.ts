/// <reference path="../globals.d.ts" />
import type DOMNodeReference from "./DOMNodeReference.d.ts";
import type DOMNodeReferenceArray from "./DOMNodeReferenceArray.d.ts";
/**
 * When loading into a page in PowerPages that has a form,
 * you can use this function by passing in the GUID of the form, and you will receive an array/record
 * of {@link DOMNodeReference}s that represent all fields, sections, sub-grids, and tabs of the given form.
 * Access these properties of the {@link BoundForm} using the logical name of the control you need to access: form['logical_name']
 * you can then execute all the methods available from DOMNodeReference
 * @param formId - The string GUID of the form you want to bind to
 * @returns An array of DOMNodeReferences, accessible as properties of a Record<string, DOMNodeReference> i.e. formProp = form["some_logicalName"]
 * @example
 * ```js
 * bindForm("form-guid-0000").then((form) => {
 *    //...use the form
 *    const field = form["field_logical_name"]
 *    // or
 *    form["other_logical_name"].someMethod()
 * })
 *
 * // or
 *
 * const form = await bindForm("form-guid-0000")
 * ```
 *  @see {@link BoundForm}
 *  @see {@link DOMNodeReference}
 */
export default function bindForm(formId: string): Promise<DOMNodeReferenceArray & Record<string, DOMNodeReference>>;
