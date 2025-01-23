import API from "./API.js";
import DOMNodeReference from "./DOMNodeReference.js";
import { createRef } from "./index.js";

/**
 * @function
 * Get all controls related to the form for manipulating with the
 * DOMNodeReference class. Rather than having to instantiate each fields that you need manually,
 * you can call this method once with the form ID and gain access to all fields
 * @param formId The string GUID of the form you want to bind to'
 * @returns An array of DOMNodeReferences
 */
export default async function getFormControls(
  formId: string
): Promise<DOMNodeReference[]> {
  try {
    const form = await API.getRecord<Form>("systemforms", formId);
    const { formxml } = form;

    const parser = new DOMParser();
    // 2. Parse the XML string into an XML Document object
    const xmlDoc = parser.parseFromString(formxml, "application/xml");

    // 3. Access the parsed XML data
    const controls = xmlDoc.getElementsByTagName("control");
    const dataFields: Promise<DOMNodeReference>[] = [];
    for (let i = 0; i < controls.length; i++) {
      const datafieldname = controls[i].getAttribute("datafieldname");
      if (datafieldname) {
        const ref = createRef(datafieldname);
        dataFields.push(ref);
      }
    }
    return Promise.all(dataFields);
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
