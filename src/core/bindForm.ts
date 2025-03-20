import type PowerPagesElementArray from "./PowerPagesElementArray.ts";
import type PowerPagesElement from "./PowerPagesElement.ts";
import enhanceArray from "../utils/enhanceArray.ts";
import get from "./getPowerPagesElement.ts";
import API from "./API.ts";

/**
 * When loading into a page in PowerPages that has a form,
 * you can use this function by passing in the GUID of the form, and you will receive an array/record
 * of {@link PowerPagesElement}s that represent all fields, sections, sub-grids, and tabs of the given form.
 * Access these properties of the {@link BoundForm} using the logical name of the control you need to access: form['logical_name']
 * you can then execute all the methods available from PowerPagesElement
 * @param formId - The string GUID of the form you want to bind to
 * @returns An array of PowerPagesElements, accessible as properties of a Record<string, PowerPagesElement> i.e. formProp = form["some_logicalName"]
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
 *  @see {@link PowerPagesElement}
 */
export default async function bindForm(
  formId: string
): Promise<PowerPagesElementArray & Record<string, PowerPagesElement>> {
  try {
    const form = await API.getRecord<Form>("systemforms", formId);
    if (form instanceof Error)
      throw new Error(`Could not get the form with ID: ${formId}`);
    const { formxml } = form;

    /**
     * since the form is coming in as a string containing XML
     * We have to set up a parser to extract the information we need
     */
    const parser = new DOMParser(); // establish the parser
    const xmlDoc = parser.parseFromString(formxml, "application/xml"); // parse the XML
    /**
     * Then we can get the attributes we want from the parsed XML
     */
    const controls = processElements(xmlDoc.getElementsByTagName("control")); // get control elements (will represent columns in the form)
    const sections = processElements(xmlDoc.getElementsByTagName("section")); // self explanatory
    const tabs = processElements(xmlDoc.getElementsByTagName("tab")); // self explanatory

    // Resolve all promises, filtering out any null values
    const resolvedRefs = await Promise.all([...controls, ...sections, ...tabs]);
    /**
     * Then, finally, 'enhance' the array, adding custom methods and a custom 'getter'
     * which will allow us to access individual nodes using the syntax `array["logical_name"]`
     */
    return enhanceArray(
      resolvedRefs.filter((ref): ref is PowerPagesElement => ref !== null)
    );
    /** handle errors */
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
      throw error; // Re-throw the original error to keep stack trace
    } else {
      console.error(error);
      throw new Error(String(error)); // Ensure non-Error values are converted to a string
    }
  }
}

function processElements(element: HTMLCollectionOf<Element>) {
  return Array.from(element)
    .map((element) => {
      // use a helper function to determine the attribute we want based on the tagname of the element
      const identifyingAttribute = getIdentifyingAttribute(element.tagName);
      const datafieldname = element.getAttribute(identifyingAttribute);
      // if we don't find the desired thing,
      if (!datafieldname) return null;

      const referenceString: string | null = createReferenceString(
        element.tagName,
        datafieldname
      );
      if (!referenceString) return null;

      return get(referenceString).catch((error) => {
        console.warn(
          `Failed to create a reference to the form field: ${datafieldname}`,
          error
        );
        return null;
      });
    })
    .filter(Boolean); // Remove null values
}

function getIdentifyingAttribute(tagName: string): string {
  return tagName === "control"
    ? "id"
    : tagName === "tab" || tagName === "section"
    ? "name"
    : "id";
}

function createReferenceString(
  tagName: string,
  datafieldname: string
): string | null {
  if (tagName === "control") return `#${datafieldname}`;
  if (tagName === "tab" || tagName === "section") {
    return `[data-name="${datafieldname}"]`;
  }
  return null; // Explicitly return null instead of undefined
}
