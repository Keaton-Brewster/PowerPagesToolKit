/**
 * Class representing a reference to a DOM node.
 */
class DOMNodeReference {
  /**
   * Creates an instance of DOMNodeReference.
   * @param {string} querySelector - The CSS selector to find the desired DOM element.
   */
  constructor(target: string): DOMNodeReference;

  target: string;
  element: HTMLElement | null;
  isLoaded: boolean;
  visibilityController: HTMLElement | null;
  defaultDisplay: string;
  value: string | null;

  /**
   * Initializes the DOMNodeReference instance by waiting for the element to be available in the DOM.
   * @returns {Promise<DOMNodeReference>} A promise that resolves to a Proxy of the DOMNodeReference instance.
   * @throws {Error} Throws an error if the element cannot be found using the provided query selector.
   */
  private init(): Promise<this>;

  /**
   * Hides the element by setting its display style to "none".
   */
  hide(): void;

  /**
   * Shows the element by restoring its default display style.
   */
  show(): void;

  /**
   * Sets the value of the HTML element.
   * @param {string} value - The value to set for the HTML element.
   */
  setValue(value: string): void;

  /**
   * Appends child elements to the HTML element.
   * @param {...HTMLElement} elements - The elements to append to the HTML element.
   */
  append(...elements: HTMLElement[]): void;

  /**
   * Inserts elements after the HTML element.
   * @param {...HTMLElement} elements - The elements to insert after the HTML element.
   */
  after(...elements: HTMLElement[]): void;

  /**
   * Retrieves the label associated with the HTML element.
   * @returns {HTMLElement} The label element associated with this element, or **null** if no label element is present
   */
  getLabel(): HTMLElement | null;

  /**
   * Appends child elements to the label associated with the HTML element.
   * @param {...HTMLElement} elements - The elements to append to the label.
   */
  appendToLabel(...elements: HTMLElement[]): void;

  /**
   * Adds a click event listener to the HTML element.
   * @param {Function} eventHandler - The function to execute when the element is clicked.
   */
  addClickListener(eventHandler: () => void): void;

  /**
   * Adds a change event listener to the HTML element.
   * @param {Function} eventHandler - The function to execute when the element's value changes.
   */
  addChangeListener(eventHandler: () => void): void;

  /**
   * Unchecks both the yes and no radio buttons if they exist.
   */
  uncheckRadios(): void;

  /**
   * Creates a validation instance for the field.
   * @param {Function} evaluationFunction - The function used to evaluate the field.
   * @param {string} fieldDisplayName - The field name to display in error if validation
   * fails.
   */
  createValidation(
    evaluationFunction: (value: any) => boolean,
    fieldDisplayName: string
  ): void;

  /**
   * Adds a tooltip with specified text to the label associated with the HTML element.
   * @param {string} text - The text to display in the tooltip.
   */
  addLabelTooltip(text: string): void;

  /**
   * Sets the inner HTML content of the HTML element.
   * @param {string} text - The text to set as the inner HTML of the element.
   */
  setTextContent(text: string): void;

  /**
   *
   * @param {boolean} shouldShow shows or hides the target
   * if = true => show, if = false => hide
   */
  toggleVisibility(shouldShow: boolean): void;

  /**
   *
   * @param {Function} condition A Function that return a boolean value to set the
   *  visibility of the targeted element. if condition() returns true, element is shown.
   *  If false, element is hidden
   * @param {DOMNodeReference} triggerNode The DOMNodeReference to which an
   * event listener will be registered to change the visibility state of the calling
   * DOMNodeReference
   */
  configureConditionalRendering(
    condition: () => boolean,
    triggerNode: DOMNodeReference
  ): void;

  /**
   * Executes a callback function once the element is fully loaded.
   * If the element is already loaded, the callback is called immediately.
   * Otherwise, a MutationObserver is used to detect when the element is added to the DOM.
   * @param {Function} callback - A callback function to execute once the element is loaded.
   */
  onceLoaded(callback: (instance: this) => void): void;
}

/**
 * Creates and initializes a DOMNodeReference instance.
 * @async
 * @function createDOMNodeReference
 * @param {string} target - The CSS selector for the desired DOM element.
 * @returns {Promise<DOMNodeReference>} A promise that resolves to a Proxy of the initialized DOMNodeReference instance.
 */
export declare async function createDOMNodeReference(
  querySelector: string | HTMLElement
): Promise<DOMNodeReference>;

/**
 * Interface representing an array of DOMNodeReference instances with additional methods.
 */
export interface DOMNodeReferenceArray extends Array<DOMNodeReference> {
  /**
   * Hides all the containers of the DOMNodeReference instances in the array.
   */
  hideAll(): void;

  /**
   * Shows all the containers of the DOMNodeReference instances in the array.
   */
  showAll(): void;
}

/**
 * Creates and initializes multiple DOMNodeReference instances.
 * @function createMultipleDOMNodeReferences
 * @param {string} querySelector - The CSS selector for the desired DOM elements.
 * @returns {Promise<DOMNodeReferenceArray>}
 * A promise that resolves to an array of Proxies of initialized
 * DOMNodeReference instances.
 */
export declare async function createMultipleDOMNodeReferences(
  querySelector: string
): Promise<DOMNodeReferenceArray>;

interface Schema {
  logicalName(): string;
  value(): any; // Adjust this type based on the structure of your schema values
}

export declare const API: {
  /**
   * Creates a new record in DataVerse.
   * @param schema An instance of a schema class, containing the desired information for the POST request.
   * @returns A Promise resolving the successful results (record ID) of the POST request, or rejecting with the error.
   */
  createRecord(schema: Schema): Promise<string>;

  /**
   * Retrieves a single record from DataVerse.
   * @param tableSetName The DataVerse SET name of the table being queried.
   * @param recordID The GUID of the record to be retrieved.
   * @param selectColumns *OPTIONAL* Custom OData query for advanced GET results. Format: select=column1,column2,column3...
   * @returns A Promise resolving the successful results of the GET request, or rejecting with the error.
   */
  getRecord(
    tableSetName: string,
    recordID: string,
    selectColumns?: string
  ): Promise<any>; // Adjust return type as necessary

  /**
   * Retrieves multiple records from DataVerse.
   * @param tableSetName The DataVerse SET name of the table being queried.
   * @param queryParameters *OPTIONAL* OData query parameters for refining search results: format = $filter=filters&$select=columns
   * @returns A Promise resolving the successful results of the GET request, or rejecting with the error.
   */
  getMultiple(tableSetName: string, queryParameters?: string): Promise<any>; // Adjust return type as necessary
};
