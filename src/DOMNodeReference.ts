import waitFor from "@/waitFor.js";
import createInfoEl from "@/createInfoElement.js";
import {
  DOMNodeInitializationError,
  DOMNodeNotFoundError,
  ConditionalRenderingError,
  ValidationConfigError,
} from "./errors.js";
import createRef from "./createDOMNodeReferences.js";

interface BoundEventListener {
  element: HTMLElement;
  handler: (e: Event) => void;
  event: keyof HTMLElementEventMap;
}

export const _init = Symbol("_I");
const _destroy = Symbol("_D");
const _valueSync = Symbol("_VS");
const _dateSync = Symbol("_DS");
const _getElementValue = Symbol("_GEV");
const _updateRadioGroup = Symbol("_URG");
const _attachVisibilityController = Symbol("_AVC");
const _attachRadioButtons = Symbol("_ARB");
const _bindMethods = Symbol("_B");
const _debounceTime = Symbol("DT");
const _observers = Symbol("O");
const _boundEventListeners = Symbol("BEV");

export default class DOMNodeReference {
  // properties initialized in the constructor
  public target: HTMLElement | string;
  public root: HTMLElement;
  private [_debounceTime]: number;
  private isLoaded: boolean;
  private defaultDisplay: string;
  private [_observers]: Array<MutationObserver> = [];
  private [_boundEventListeners]: Array<BoundEventListener> = [];
  /**
   * The value of the element that this node represents
   * stays in syncs with the live DOM elements?.,m  via event handler
   */
  public value: any;

  // other properties made available after async _init

  /**
   * The element targeted when instantiating DOMNodeReference.
   * Made available in order to perform normal DOM traversal,
   * or access properties not available through this class.
   */
  public declare element: HTMLElement;
  private declare visibilityController: HTMLElement;
  public declare checked: boolean;
  /**
   * Represents the 'yes' option of a boolean radio field.
   * This property is only available when the parent node
   * is a main field for a boolean radio input.
   */
  public declare yesRadio: DOMNodeReference | null;
  /**
   * Represents the 'no' option of a boolean radio field.
   * This property is only available when the parent node
   * is a main field for a boolean radio input.
   */
  public declare noRadio: DOMNodeReference | null;

  /**
   * Creates an instance of DOMNodeReference.
   * @param target - The CSS selector to find the desired DOM element.
   * @param root - Optionally specify the element within to search for the element targeted by 'target'
   * Defaults to 'document.body'
   */
  /******/ /******/ constructor(
    target: HTMLElement | string,
    root: HTMLElement = document.body,
    debounceTime: number
  ) {
    this.target = target;
    this.root = root;
    this[_debounceTime] = debounceTime;
    this.isLoaded = false;
    this.defaultDisplay = "";
    this.value = null;

    // we want to ensure that all method calls from the consumer have access to 'this'
    this[_bindMethods]();
    // we defer the rest of initialization
  }

  public async [_init](): Promise<void> {
    /**
     * dynamically define the _init method using our custom symbol
     * this makes it so that the _init method cannot be accessed outside
     * of this package: i.e. by any consumers of the package
     */
    try {
      if (this.target instanceof HTMLElement) {
        this.element = this.target;
      } else {
        this.element = <HTMLElement>(
          await waitFor(this.target, this.root, false, this[_debounceTime])
        );
      }

      if (!this.element) {
        throw new DOMNodeNotFoundError(this);
      }
      if (this.element.classList.contains("boolean-radio")) {
        await this[_attachRadioButtons]();
      }

      this[_valueSync]();
      this[_attachVisibilityController]();
      this.defaultDisplay = this.visibilityController.style.display;

      // when the element is removed from the dom, destroy this
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (Array.from(mutation.removedNodes).includes(this.element)) {
            this[_destroy]();
            observer.disconnect();
            break;
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      this.isLoaded = true;
    } catch (error) {
      const errorMessage: string =
        error instanceof Error ? error.message : String(error);
      throw new DOMNodeInitializationError(this, errorMessage);
    }
  }

  /**
   * Initializes value synchronization with appropriate event listeners
   * based on element type.
   * @private
   */
  private async [_valueSync](): Promise<void> {
    try {
      // Initial sync
      this.updateValue();

      if (!(this.element instanceof HTMLElement)) {
        throw new Error("Element is not a valid HTML element");
      }

      // Define event mappings
      const eventMapping: Record<string, keyof HTMLElementEventMap> = {
        checkbox: "click",
        radio: "click",
        select: "change",
        "select-multiple": "change",
        // Add other input types as needed
      };

      // Determine event type based on element
      let eventType: keyof HTMLElementEventMap;
      if (this.element instanceof HTMLSelectElement) {
        eventType = "change";
      } else if (this.element instanceof HTMLInputElement) {
        eventType = eventMapping[this.element.type] || "input";
      } else {
        eventType = "input";
      }

      // Attach main event listener
      this.element.addEventListener(eventType, this.updateValue);

      // push element and handler for event listener cleanup on _destroy()
      const _element = <HTMLElement>this.element;
      const _updateValue = this.updateValue;
      this[_boundEventListeners].push({
        element: _element,
        handler: _updateValue,
        event: eventType,
      });

      // Handle date inputs separately
      if (
        this.element instanceof HTMLInputElement &&
        this.element.dataset.type === "date"
      ) {
        await this[_dateSync](this.element);
      }
    } catch (error) {
      throw new DOMNodeInitializationError(
        this,
        `Failed to initialize value sync: ${error}`
      );
    }
  }

  private async [_dateSync](element: HTMLInputElement): Promise<void> {
    const parentElement = element.parentElement;
    if (!parentElement) {
      throw new Error("Date input must have a parent element");
    }

    const dateNode = <HTMLElement>(
      await waitFor("[data-date-format]", parentElement, false, 1500)
    );
    dateNode.addEventListener("select", this.updateValue);

    // make sure to push into bound listeners for event cleanup on _destroy()
    const _handler = this.updateValue;
    this[_boundEventListeners].push({
      element: dateNode,
      handler: _handler,
      event: "select",
    });
  }

  /**
   * Gets the current value of the element based on its type
   * @private
   * @returns Object containing value and optional checked state
   */
  private [_getElementValue](): ElementValue {
    const input = this.element as HTMLInputElement;
    const select = this.element as HTMLSelectElement;

    switch (input.type) {
      case "checkbox":
      case "radio":
        return {
          value: input.checked,
          checked: input.checked,
        };

      case "select-multiple":
        return {
          value: Array.from(select.selectedOptions).map(
            (option) => option.value
          ),
        };

      case "select-one":
        return {
          value: select.value,
        };

      case "number":
        return {
          value: input.value !== "" ? Number(input.value) : null,
        };

      default:
        return {
          value:
            this.element.classList.contains("decimal") ||
            this.element.classList.contains("money")
              ? parseFloat(input.value)
              : input.value,
        };
    }
  }

  /**
   * Updates related radio buttons if this is part of a radio group
   * @private
   */
  private [_updateRadioGroup](): void {
    if (
      this.yesRadio instanceof DOMNodeReference &&
      this.noRadio instanceof DOMNodeReference
    ) {
      this.yesRadio.updateValue();
      this.noRadio?.updateValue();
      this.checked = this.yesRadio.checked;
      this.value = this.yesRadio.checked;
    }
  }

  private [_attachVisibilityController](): void {
    // Set the default visibility controller to the element itself
    this.visibilityController = this.element;

    // If the element is a table, use its closest fieldset as the controller
    if (this.element.tagName === "TABLE") {
      const fieldset = this.element.closest("fieldset");
      if (fieldset) {
        this.visibilityController = fieldset;
      }
      return;
    }

    // For specific tag types, use the closest 'td' if available as the controller
    const tagsRequiringTdParent = [
      "SPAN",
      "INPUT",
      "TEXTAREA",
      "SELECT",
      "TABLE",
    ];
    if (tagsRequiringTdParent.includes(this.element.tagName)) {
      const tdParent = this.element.closest("td");
      if (tdParent) {
        this.visibilityController = tdParent;
      }
    }
  }

  private async [_attachRadioButtons](): Promise<void> {
    this.yesRadio = <DOMNodeReference>await createRef(`#${this.element.id}_1`);
    this.noRadio = <DOMNodeReference>await createRef(`#${this.element.id}_0`);
  }

  private [_bindMethods]() {
    // Iterate over all properties of the instance
    for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
      const value = this[key as keyof this];
      // Bind only functions (excluding the constructor)
      if (key !== "constructor" && typeof value === "function") {
        (this as any)[key] = value.bind(this);
      }
    }
  }

  private [_destroy](): void {
    this[_boundEventListeners]?.forEach((binding) => {
      binding.element?.removeEventListener(binding.event, binding.handler);
    });
    this[_observers]?.forEach((observer) => {
      observer.disconnect();
    });
    this.yesRadio?.[_destroy]();
    this.noRadio?.[_destroy]();
    this.yesRadio = null;
    this.noRadio = null;
    this.isLoaded = false;
    this.value = null;
  }

  /**
   * Updates the value and checked state based on element type
   * @public
   */
  public updateValue(): void {
    const elementValue = this[_getElementValue]();

    // Update instance properties
    this.value = elementValue.value;
    if (elementValue.checked !== undefined) {
      this.checked = elementValue.checked;
    }

    // Handle radio button group if present
    this[_updateRadioGroup]();
  }

  /**
   * Sets up an event listener based on the specified event type, executing the specified
   * event handler
   * @param eventType - The DOM event to watch for
   * @param eventHandler - The callback function that runs when the
   * specified event occurs.
   * @returns - Instance of this [provides option to method chain]
   */
  public on(
    eventType: keyof HTMLElementEventMap,
    eventHandler: (e: Event) => void
  ): DOMNodeReference {
    if (typeof eventHandler !== "function") {
      throw new Error(
        `Argument "eventHandler" must be a Function. Received: ${typeof eventHandler}`
      );
    }

    this.element.addEventListener(eventType, eventHandler.bind(this));

    // push to bound listeners for cleanup on _destroy()
    const _element = <HTMLElement>this.element;
    const _handler = eventHandler;
    this[_boundEventListeners].push({
      element: _element,
      handler: _handler,
      event: eventType,
    });

    return this;
  }

  /**
   * Hides the element by setting its display style to "none".
   * @returns - Instance of this [provides option to method chain]
   */
  public hide(): DOMNodeReference {
    this.visibilityController.style.display = "none";
    return this;
  }

  /**
   * Shows the element by restoring its default display style.
   * @returns - Instance of this [provides option to method chain]
   */
  public show(): DOMNodeReference {
    this.visibilityController.style.display = this.defaultDisplay;
    return this;
  }

  /**
   *
   * @param shouldShow - Either a function that returns true or false,
   * or a natural boolean to determine the visibility of this
   * @returns - Instance of this [provides option to method chain]
   */
  public toggleVisibility(
    shouldShow: ((instance: DOMNodeReference) => boolean) | boolean
  ): DOMNodeReference {
    if (shouldShow instanceof Function) {
      shouldShow(this) ? this.show() : this.hide();
    } else {
      shouldShow ? this.show() : this.hide();
    }
    return this;
  }

  /**
   * Sets the value of the HTML element.
   * @param value - The value to set for the HTML element.
   * for parents of boolean radios, pass true or false as value, or
   * an expression returning a boolean
   * @returns - Instance of this [provides option to method chain]
   */
  public setValue(value: (() => any) | any): DOMNodeReference {
    if (value instanceof Function) {
      value = value();
    }
    if (this.element.classList.contains("boolean-radio")) {
      (
        (this.yesRadio as DOMNodeReference).element as HTMLInputElement
      ).checked = value;
      ((this.noRadio as DOMNodeReference).element as HTMLInputElement).checked =
        !value;
    } else {
      (this.element as HTMLInputElement).value = value;
    }
    return this;
  }

  /**
   * Disables the element so that users cannot input any data
   * @returns - Instance of this [provides option to method chain]
   */
  public disable(): DOMNodeReference {
    try {
      (this.element as HTMLInputElement).disabled = true;
    } catch (error) {
      const errorMessage: string =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `There was an error trying to disable the target: ${this.target}: "${errorMessage}"`
      );
    }
    return this;
  }

  /**
   * Clears all values and states of the element.
   * Handles different input types appropriately, and can be called
   * on an element containing N child inputs to clear all
   *
   * @returns - Instance of this [provides option to method chain]
   * @throws If clearing values fails
   */
  public async clearValue(): Promise<DOMNodeReference> {
    try {
      const element = this.element;

      if (element instanceof HTMLInputElement) {
        switch (element.type.toLowerCase()) {
          case "checkbox":
          case "radio":
            element.checked = false;
            this.checked = false;
            this.value = false;
            break;

          case "number":
            element.value = "";
            this.value = "";
            break;

          default: // handles text, email, tel, etc.
            element.value = "";
            this.value = "";
            break;
        }
      } else if (element instanceof HTMLSelectElement) {
        if (element.multiple) {
          Array.from(element.options).forEach(
            (option) => (option.selected = false)
          );
          this.value = [];
        } else {
          element.selectedIndex = -1;
          this.value = "";
        }
      } else if (element instanceof HTMLTextAreaElement) {
        element.value = "";
        this.value = "";
      } else {
        this.value = "";

        // Handle nested input elements in container elements
        const childInputs = Array.from(
          this.element.querySelectorAll("input, select, textarea")
        );

        if (childInputs.length > 0) {
          const promises = childInputs.map(async (input) => {
            const inputRef = <DOMNodeReference>(
              await createRef(input as HTMLElement, { multiple: false })
            );
            return inputRef.clearValue();
          });

          await Promise.all(promises);
        }
      }

      // Handle radio button group if present
      if (
        this.yesRadio instanceof DOMNodeReference &&
        this.noRadio instanceof DOMNodeReference
      ) {
        await this.yesRadio.clearValue();
        await this.noRadio.clearValue();
      }

      // Dispatch events in the correct order
      const events = [
        new Event("input", { bubbles: true }),
        new Event("change", { bubbles: true }),
        new Event("click", { bubbles: true }),
      ];

      events.forEach((event) => this.element.dispatchEvent(event));

      return this;
    } catch (error) {
      const errorMessage = `Failed to clear values for element with target "${
        this.target
      }": ${error instanceof Error ? error.message : String(error)}`;
      throw new Error(errorMessage);
    }
  }

  /**
   * Enables the element so that users can input data
   * @returns - Instance of this [provides option to method chain]
   */
  public enable(): DOMNodeReference {
    try {
      (this.element as HTMLInputElement).disabled = false;
    } catch (e) {
      throw new Error(
        `There was an error trying to disable the target: ${this.target}`
      );
    }
    return this;
  }

  /**
   *
   * @param elements - The elements to prepend to the element targeted by this.
   * @returns - Instance of this [provides option to method chain]
   */
  public prepend(...elements: HTMLElement[]): DOMNodeReference {
    this.element.prepend(...elements);
    return this;
  }

  /**
   * Appends child elements to the HTML element.
   * @param elements - The elements to append to the element targeted by this.
   * @returns - Instance of this [provides option to method chain]
   */
  public append(...elements: HTMLElement[]): DOMNodeReference {
    this.element.append(...elements);
    return this;
  }

  /**
   * Inserts elements before the HTML element.
   * @param elements - The elements to insert before the HTML element.
   * @returns - Instance of this [provides option to method chain]
   */
  public before(...elements: HTMLElement[]): DOMNodeReference {
    this.element.before(...elements);
    return this;
  }

  /**
   * Inserts elements after the HTML element.
   * @param elements - The elements to insert after the HTML element.
   * @returns - Instance of this [provides option to method chain]
   */
  public after(...elements: HTMLElement[]): DOMNodeReference {
    this.element.after(...elements);
    return this;
  }

  /**
   * Retrieves the label associated with the HTML element.
   * @returns {HTMLElement} The label element associated with this element.
   */
  public getLabel(): HTMLElement | null {
    return document.querySelector(`#${this.element.id}_label`) || null;
  }

  /**
   * Adds a tooltip with specified text to the label associated with the HTML element.
   * @param innerHTML - The innerHTML to append into the tooltip.
   * @param containerStyle - Optional object with CSS Styles to apply to the info element
   * @returns - Instance of this [provides option to method chain]
   */
  public addLabelTooltip(
    innerHTML: string,
    containerStyle?: Partial<CSSStyleDeclaration>
  ): DOMNodeReference {
    this.getLabel()?.append(
      createInfoEl(innerHTML, containerStyle || undefined)
    );
    return this;
  }

  /**
   * Adds a tooltip with the specified text to the element
   * @param innerHTML - The innerHTML to append into the tooltip
   * @param containerStyle - Optional object with CSS Styles to apply to the info element
   * @returns - Instance of this [provides option to method chain]
   */
  public addTooltip(
    innerHTML: string,
    containerStyle?: Partial<CSSStyleDeclaration>
  ): DOMNodeReference {
    this.append(createInfoEl(innerHTML, containerStyle || undefined));
    return this;
  }

  /**
   * Sets the inner HTML content of the HTML element.
   * @param {string} string - The text to set as the inner HTML of the element.
   * @returns - Instance of this [provides option to method chain]
   */
  public setInnerHTML(string: string) {
    this.element.innerHTML = string;
    return this;
  }

  /**
   * Removes this element from the DOM
   * @returns - Instance of this [provides option to method chain]
   */
  public remove() {
    this.element.remove();
    return this;
  }

  /**
   *
   * @param {Partial<CSSStyleDeclaration} options and object containing the styles you want to set : {key: value} e.g.: {'display': 'block'}
   * @returns - Instance of this [provides option to method chain]
   */
  public setStyle(options: Partial<CSSStyleDeclaration>) {
    if (Object.prototype.toString.call(options) !== "[object Object]") {
      throw new Error(
        `powerpagestoolkit: 'DOMNodeReference.setStyle' required options to be in the form of an object. Argument passed was of type: ${typeof options}`
      );
    }

    for (const key in options) {
      (this.element as HTMLElement).style[key as any] = options[key] as string;
    }
    return this;
  }

  /**
   * Unchecks both the yes and no radio buttons if they exist.
   * @returns - Instance of this [provides option to method chain]
   */
  public uncheckRadios(): DOMNodeReference {
    if (this.yesRadio && this.noRadio) {
      (this.yesRadio.element as HTMLInputElement).checked = false;
      (this.noRadio.element as HTMLInputElement).checked = false;
    } else {
      console.error(
        "[SYNACT] Attempted to uncheck radios for an element that has no radios"
      );
    }
    return this;
  }

  /**
   * Configures conditional rendering for the target element based on a condition
   * and the visibility of one or more trigger elements.
   *
   * @param condition - A function that returns a boolean to determine
   * the visibility of the target element. If `condition()` returns true, the element is shown;
   * otherwise, it is hidden.
   * @param dependencies - An array of `DOMNodeReference` instances. Event listeners are
   * registered on each to toggle the visibility of the target element based on the `condition` and the visibility of
   * the target node.
   * @throws - When there's an error in setting up conditional rendering
   * @returns - Instance of this [provides option to method chain]
   */
  public configureConditionalRendering(
    condition: () => boolean,
    dependencies?: Array<DOMNodeReference>,
    clearValuesOnHide: boolean = true
  ): DOMNodeReference {
    try {
      // Validate inputs
      if (typeof condition !== "function") {
        throw new TypeError("Condition must be a function");
      }

      // bind this to the condition function
      condition = condition.bind(this);

      // Initialize state
      const initialState = condition();
      this.toggleVisibility(initialState);

      // Early return if no dependencies
      if (!dependencies?.length) {
        console.warn(
          `powerpagestoolkit: No dependencies provided for conditional rendering of ${this}. ` +
            "Include referenced nodes in the dependency array if using them in rendering logic."
        );
        return this;
      }

      this._configDependencyTracking(
        () => this.toggleVisibility(condition()),
        dependencies,
        {
          clearValuesOnHide,
          observeVisibility: true,
          trackInputEvents: false,
          trackRadioButtons: false,
        }
      );

      return this;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new ConditionalRenderingError(this, errorMessage);
    }
  }

  /**
   * Sets up validation and requirement rules for the field with enhanced error handling and dynamic updates.
   *
   * @param isRequired - Function determining if field is required
   * @param isValid - Function validating field input
   * @param fieldDisplayName - Display name for error messages
   * @param dependencies - Fields that trigger requirement/validation updates
   * @returns - Instance of this
   * @throws - If validation setup fails
   */
  public configureValidationAndRequirements(
    isRequired: () => boolean,
    isValid: () => boolean,
    fieldDisplayName: string,
    dependencies: Array<DOMNodeReference>
  ): DOMNodeReference {
    // Input validation
    if (!fieldDisplayName?.trim()) {
      throw new ValidationConfigError(this, "Field display name is required");
    }

    if (!Array.isArray(dependencies)) {
      throw new ValidationConfigError(this, "Dependencies must be an array");
    }

    // Create and configure validator
    try {
      //make sure to bind 'this' to the methods for proper access to consumer
      isRequired = isRequired.bind(this);
      isValid = isValid.bind(this);

      if (typeof Page_Validators === "undefined") {
        throw new ValidationConfigError(this, "Page_Validators not found");
      }

      const validatorId = `${this.element.id}Validator`;

      // Create new validator
      const newValidator = document.createElement("span");
      newValidator.style.display = "none";
      newValidator.id = validatorId;

      // Configure validator properties
      const validatorConfig = {
        controltovalidate: this.element.id,
        errormessage: `<a href='#${this.element.id}_label'>${fieldDisplayName} is a required field</a>`,
        evaluationfunction: () => {
          // Only validate if the field is required and visible
          const isFieldRequired = isRequired();
          const isFieldVisible =
            window.getComputedStyle(this.visibilityController).display !==
            "none";

          if (!isFieldRequired || !isFieldVisible) {
            return true;
          }

          return isValid();
        },
      };

      // Apply configuration
      Object.assign(newValidator, validatorConfig);

      // Add to page validators
      Page_Validators.push(newValidator);

      // Initial required state
      this.setRequiredLevel(isRequired());

      // Set up dependency tracking
      this._configDependencyTracking(
        () => this.setRequiredLevel(isRequired()),
        dependencies
      );
    } catch (error: any) {
      throw new ValidationConfigError(
        this,
        `Failed to configure validation: ${error}`
      );
    }

    return this;
  }

  /**
   * Sets up tracking for dependencies using both event listeners and mutation observers.
   * @private
   * @param handler - The function to execute when dependencies change
   * @param dependencies - Array of dependent DOM nodes to track
   * @param options - Additional configuration options
   */
  private _configDependencyTracking(
    handler: () => void,
    dependencies: Array<DOMNodeReference>,
    options: {
      clearValuesOnHide?: boolean;
      observeVisibility?: boolean;
      trackInputEvents?: boolean;
      trackRadioButtons?: boolean;
    } = {
      clearValuesOnHide: false,
      observeVisibility: true,
      trackInputEvents: true,
      trackRadioButtons: true,
    }
  ): void {
    const {
      clearValuesOnHide = false,
      observeVisibility = true,
      trackInputEvents = true,
      trackRadioButtons = true,
    } = options;

    if (!dependencies?.length) {
      console.warn(
        `powerpagestoolkit: No dependencies specified for ${this.element.id}. ` +
          "Include all referenced nodes in the dependency array for proper tracking."
      );
      return;
    }

    dependencies.forEach((dep) => {
      if (!dep || !(dep instanceof DOMNodeReference)) {
        throw new TypeError(
          "Each dependency must be a valid DOMNodeReference instance"
        );
      }

      // Handle value changes
      const handleChange = () => {
        handler();

        // Handle clearing values if element becomes hidden
        if (
          clearValuesOnHide &&
          window.getComputedStyle(this.visibilityController).display === "none"
        ) {
          this.clearValue();
        }
      };

      dep.on("change", handleChange);
      //make sure to track event listener for _destroy()
      this[_boundEventListeners].push({
        element: dep.element,
        event: "change",
        handler: handleChange,
      });

      if (trackInputEvents) {
        dep.on("input", handleChange);
        //make sure to track event listener for _destroy()
        this[_boundEventListeners].push({
          element: dep.element,
          event: "input",
          handler: handleChange,
        });
      }

      // Handle visibility changes
      if (observeVisibility) {
        const observer = new MutationObserver(() => {
          const display = window.getComputedStyle(
            dep.visibilityController
          ).display;
          if (display !== "none") {
            handler();
          }
        });

        observer.observe(dep.visibilityController, {
          attributes: true,
          attributeFilter: ["style"],
          subtree: false,
        });

        this[_observers].push(observer);
      }

      // Handle radio button changes if applicable
      if (trackRadioButtons && dep.yesRadio && dep.noRadio) {
        [dep.yesRadio, dep.noRadio].forEach((radio) => {
          <DOMNodeReference>radio.on("change", handleChange);
          //make sure to track event listener for _destroy()
          this[_boundEventListeners].push({
            element: radio.element,
            event: "change",
            handler: handleChange,
          });
        });
      }
    });
  }

  /**
   * Sets the required level for the field by adding or removing the "required-field" class on the label.
   *
   * @param isRequired - Determines whether the field should be marked as required.
   * If true, the "required-field" class is added to the label; if false, it is removed.
   * @returns - Instance of this [provides option to method chain]
   */
  public setRequiredLevel(
    isRequired: (() => boolean) | boolean
  ): DOMNodeReference {
    if (isRequired instanceof Function) {
      isRequired()
        ? this.getLabel()?.classList.add("required-field")
        : this.getLabel()?.classList.remove("required-field");
      return this;
    } else {
      isRequired
        ? this.getLabel()?.classList.add("required-field")
        : this.getLabel()?.classList.remove("required-field");
      return this;
    }
  }

  /**
   * Executes a callback function once the element is fully loaded.
   * If the element is already loaded, the callback is called immediately.
   * Otherwise, a MutationObserver is used to detect when the element is added to the DOM.
   * @param callback - A callback function to execute once the element is loaded.
   * Receives instance of 'this' as an argument
   */
  public onceLoaded(callback: (instance: DOMNodeReference) => any): any {
    if (this.isLoaded) {
      callback(this);
      return;
    }

    if (this.target instanceof HTMLElement) {
      callback(this);
      return;
    }
    const observer = new MutationObserver(() => {
      if (document.querySelector(this.target as string)) {
        observer.disconnect(); // Stop observing once loaded
        this.isLoaded = true;
        callback(this); // Call the provided callback
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
    });

    this[_observers].push(observer);
  }
}
