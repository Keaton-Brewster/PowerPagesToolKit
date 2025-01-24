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

    const parser = new DOMParser();
    // 2. Parse the XML string into an XML Document object
    const xmlDoc = parser.parseFromString(formxml, "application/xml");

    // 3. Access the parsed XML data
    const controls = xmlDoc.getElementsByTagName("control");
    
    const dataFields: Promise<DOMNodeReference | null>[] = [];

    for (let i = 0; i < controls.length; i++) {
      const datafieldname = controls[i].getAttribute("datafieldname");
      if (datafieldname) {
        const refPromise = createRef(`#${datafieldname}`).catch((error) => {
          console.warn(
            `Failed to create a reference to the form field: ${datafieldname}`,
            error
          );
          return null;
        });
        dataFields.push(refPromise);
      }
    }

    // Resolve all promises, filtering out any null values
    const resolvedRefs = await Promise.all(dataFields);
    return enhanceArray<T>(
      <DOMNodeReferenceArray>(
        resolvedRefs.filter((ref): ref is DOMNodeReference => ref !== null)
      )
    );
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
