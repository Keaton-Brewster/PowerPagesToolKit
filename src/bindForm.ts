import API from "./API.js";
import DOMNodeReference from "./DOMNodeReference.js";
import { createRef } from "./index.js";
import {
  DOMNodeReferenceArray,
  enhanceArray,
} from "./DOMNodeReferenceArray.js";

/**
 * @function
 * Get all controls related to the form for manipulating with the
 * DOMNodeReference class. Rather than having to instantiate each fields that you need manually,
 * you can call this method once with the form ID and gain access to all fields
 * @param formId The string GUID of the form you want to bind to
 * @returns An array of DOMNodeReferences
 */
export default async function bindForm<T extends string>(
  formId: string
): Promise<DOMNodeReferenceArray & Record<T, DOMNodeReference>> {
  try {
    const form = await API.getRecord<IForm>("systemforms", formId);
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
    return enhanceArray<T>(
      <DOMNodeReferenceArray>(
        resolvedRefs.filter((ref): ref is DOMNodeReference => ref !== null)
      )
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

function processElements(array: HTMLCollectionOf<Element>) {
  try {
    const results: Promise<DOMNodeReference | null>[] = [];
    for (let i = 0; i < array.length; i++) {
      const datafieldname = array[i].getAttribute("datafieldname");
      if (datafieldname) {
        /**
         * since 'createRef()' returns a Promise<DOMNodeReference>, when we don't 'await'
         * we get the pending promise itself, rather than the resolved 'DOMNodeReference'
         * This way, we can collect all our pending promises with their own catch statements
         * and then resolve them all at once later
         */
        const refPromise = createRef(`#${datafieldname}`).catch((error) => {
          console.warn(
            `Failed to create a reference to the form field: ${datafieldname}`,
            error
          );
          return null;
        });
        results.push(refPromise);
      }
    }
    return results;
  } catch (error: any) {
    if (error instanceof Error) {
      console.error(error.message);
      throw error;
    } else {
      console.error(error);
      throw new Error(String(error));
    }
  }
}
