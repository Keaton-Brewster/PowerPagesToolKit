/**
 * Class representing a reference to a DOM node.
 */
class DOMNodeReference {
  /**
   * Creates an instance of DOMNodeReference.
   * @param {string} querySelector - The CSS selector to find the desired DOM element.
   */
  constructor(target: string): DOMNodeReference;

  /**
   * The element targeted when instantiating DOMNodeReference.
   * Made available in order to perform normal DOM traversal,
   * or access properties not available through this class.
   * @type {HTMLElement | null}
   */
  element: HTMLElement | null;
  isLoaded: boolean;
  /**
   * The value of the element that this node represents
   * stays in syncs with the live DOM elements via event handler
   * @type {string | null}
   */
  value: string | null;
  /**
   * Represents the 'yes' option of a boolean radio field.
   * This property is only available when the parent node
   * is a main field for a boolean radio input.
   * @type {DOMNodeReference | undefined}
   */
  yesRadio?: DOMNodeReference;

  /**
   * Represents the 'no' option of a boolean radio field.
   * This property is only available when the parent node
   * is a main field for a boolean radio input.
   * @type {DOMNodeReference | undefined}
   */
  noRadio?: DOMNodeReference;

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
   * @param {() => any} value - The value to set for the HTML element.
   * for parents of boolean radios, pass true or false as value, or
   * an expression returning a boolean
   */
  setValue(value: string): void;

  /**
   * Disables the element so that users cannot input any data
   */
  disable(): void;

  /**
   * Enables the element so that users can input data
   */
  enable(): void;

  /**
   * Prepends elements to the target
   * @param {HTMLElement[] | DOMNodeReference[]} nodes - The elements to prepend to the HTML element
   */
  prepend(...nodes: HTMLElement[] | DOMNodeReference[]): void;

  /**
   * Appends child elements to the HTML element.
   * @param {HTMLElement[] | DOMNodeReference[]} nodes - The elements to append to the HTML element.
   */
  append(...nodes: HTMLElement[] | DOMNodeReference[]): void;

  /**
   * Inserts elements before the HTML element.
   * @param {HTMLElement[] | DOMNodeReference[]} nodes - The elements to insert before the HTML element.
   */
  before(...nodes: HTMLElement[] | DOMNodeReference[]): void;

  /**
   * Inserts elements after the HTML element.
   * @param {HTMLElement[] | DOMNodeReference[]} nodes - The elements to insert after the HTML element.
   */
  after(...nodes: HTMLElement[] | DOMNodeReference[]): void;

  /**
   * Retrieves the label associated with the HTML element.
   * @returns {HTMLElement} The label element associated with this element.
   * @throws {Error} Throws an error if the label cannot be found.
   */
  getLabel(): HTMLElement;

  /**
   * Appends child elements to the label associated with the HTML element.
   * @param {...HTMLElement} elements - The elements to append to the label.
   */
  appendToLabel(...elements: HTMLElement[]): void;

  /**
   * Sets up an event listener based on the specified event type, executing the specified
   * event handler
   * @param {string} eventType - The DOM event to watch for
   * @param {(this: DOMNodeReference, e: Event) => void} eventHandler - The callback function that runs when the
   * specified event occurs
   */
  on(eventType: string, eventHandler: (event: Event) => void): void;
  /**
   * Unchecks both the yes and no radio buttons if they exist.
   */
  uncheckRadios(): void;

  /**
   * Sets up validation and requirement rules for the field. This function dynamically updates the field's required status and validates its input based on the specified conditions.
   *
   * @param {function(this: DOMNodeReference): boolean} isRequired - A function that determines whether the field should be required. Returns `true` if required, `false` otherwise.
   * @param {function(this: DOMNodeReference): boolean} isValid - A function that checks if the field's input is valid. Returns `true` if valid, `false` otherwise.
   * @param {string} fieldDisplayName - The name of the field, used in error messages if validation fails.
   * @param {Array<DOMNodeReference>} [dependencies] Other fields that this field’s requirement depends on. When these fields change, the required status of this field is re-evaluated. Make sure any DOMNodeReference used in `isRequired` or `isValid` is included in this array.
   */
  configureValidationAndRequirements(
    isRequired: (this: this) => boolean,
    isValid: (this: this) => boolean,
    fieldDisplayName: string,
    dependencies: Array<DOMNodeReference>
  ): void;

  /**
   * Sets the required level for the field by adding or removing the "required-field" class on the label.
   *
   * @param {boolean} isRequired - Determines whether the field should be marked as required.
   * If true, the "required-field" class is added to the label; if false, it is removed.
   */
  setRequiredLevel(isRequired: boolean): void;

  /**
   * Adds a tooltip with specified text to the label associated with the HTML element.
   * @param {string} text - The text to display in the tooltip.
   */
  addLabelTooltip(text: string): void;

  /**
   * Adds a tooltip with the specified text to the element
   * @param {string} text - The text to display in the tooltip
   */
  addTooltip(text: string): void;

  /**
   * Sets the inner HTML content of the HTML element.
   * @param {string} text - The text to set as the inner HTML of the element.
   */
  setTextContent(text: string): void;

  /**
   *
   * @param {Partial<CSSStyleDeclaration>} options - An object with the style properties (keys) and updated styles (values)
   * to apply to the this. {"key": "value"}
   */
  setStyle(options: Partial<CSSStyleDeclaration>): void;

  /**
   *
   * @param {boolean} shouldShow shows or hides the target
   * if = true => show, if = false => hide
   */
  toggleVisibility(shouldShow: boolean): void;

  /**
   * Configures conditional rendering for the target element based on a condition
   * and the visibility of one or more trigger elements.
   *
   * @param {(this: DOMNodeReference) => boolean} condition - A function that returns a boolean to determine
   * the visibility of the target element. If `condition()` returns true, the element is shown;
   * otherwise, it is hidden.
   * @param {Array<DOMNodeReference>} dependencies - An array of `DOMNodeReference` instances. Event listeners are
   * registered on each to toggle the visibility of the target element based on the `condition` and the visibility of
   * the target node.
   */
  configureConditionalRendering(
    condition: (this: DOMNodeReference) => boolean,
    dependencies: DOMNodeReference[]
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
