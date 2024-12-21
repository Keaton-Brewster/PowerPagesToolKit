import waitFor from "@/waitFor.js";
import createInfoEl from "@/createInfoElement.js";
import {
  DOMNodeInitializationError,
  DOMNodeNotFoundError,
  ConditionalRenderingError,
  ValidationConfigError,
} from "./errors.js";
import { createDOMNodeReference } from "./createDOMNodeReferences.js";

export const _init = Symbol("_init");

export default class DOMNodeReference {
  // properties initialized in the constructor
  public target: HTMLElement | string;
  private isLoaded: boolean;
  private defaultDisplay: string;
  /**
   * The value of the element that this node represents
   * stays in syncs with the live DOM elements?.,m  via event handler
   * @type {any}
   */
  public value: any;

  // other properties made available after async _init
  /**
   * The element targeted when instantiating DOMNodeReference.
   * Made available in order to perform normal DOM traversal,
   * or access properties not available through this class.
   * @property {HTMLElement | null}
   */
  public declare element: HTMLElement;
  private declare visibilityController: HTMLElement;
  public declare checked: boolean;
  /**
   * Represents the 'yes' option of a boolean radio field.
   * This property is only available when the parent node
   * is a main field for a boolean radio input.
   * @property {DOMNodeReferenceProxy | null}
   */
  public declare yesRadio?: DOMNodeReference | null;
  /**
   * Represents the 'no' option of a boolean radio field.
   * This property is only available when the parent node
   * is a main field for a boolean radio input.
   * @property {DOMNodeReferenceProxy | null}
   */
  public declare noRadio?: DOMNodeReference | null;

  /**
   * Creates an instance of DOMNodeReference.
   * @param {string} target - The CSS selector to find the desired DOM element.
   */
  /******/ /******/ constructor(target: HTMLElement | string) {
    this.target = target;
    this.isLoaded = false;
    this.defaultDisplay = "";
    this.value = null;

    // we defer the rest of initialization
  }

  public async [_init](): Promise<void> {
    /**
     * dynamically define the _init method using our custom symbol
     * this makes it so that the _init method cannot be accessed outside
     * of this package: i.e. by any consumers of the package
     */
    try {
      const element = await waitFor(this.target);
      this.element = element;

      if (!this.element) {
        throw new DOMNodeNotFoundError(this);
      }
      if (this.element.classList.contains("boolean-radio")) {
        await this._attachRadioButtons();
      }

      this._initValueSync();
      this._attachVisibilityController();
      this.defaultDisplay = this.visibilityController.style.display;

      this.isLoaded = true;
    } catch (e) {
      throw new DOMNodeInitializationError(this, e as string);
    }
  }

  /**
   * Initializes value synchronization with appropriate event listeners
   * based on element type.
   * @private
   */
  private _initValueSync(): void {
    // Initial sync
    this.updateValue();

    const input = this.element as HTMLInputElement;
    const eventMapping: Record<string, string> = {
      checkbox: "click",
      radio: "click",
      "select-one": "change",
      select: "change",
      "select-multiple": "change",
    };

    // Use bound event handler to maintain context
    const boundUpdateValue = this.updateValue.bind(this);

    // Add appropriate event listener based on element type
    const eventType = eventMapping[input.type] || "input";
    this.element.addEventListener(eventType, boundUpdateValue);
  }

  /**
   * Updates the value and checked state based on element type
   * @public
   */
  public updateValue(): void {
    const elementValue = this.getElementValue();

    // Update instance properties
    this.value = elementValue.value;
    if (elementValue.checked !== undefined) {
      this.checked = elementValue.checked;
    }

    // Handle radio button group if present
    this.updateRadioGroup();
  }

  /**
   * Gets the current value of the element based on its type
   * @private
   * @returns {ElementValue} Object containing value and optional checked state
   */
  private getElementValue(): ElementValue {
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
          value: this.element.classList.contains("decimal")
            ? parseFloat(input.value)
            : input.value,
        };
    }
  }

  /**
   * Updates related radio buttons if this is part of a radio group
   * @private
   */
  private updateRadioGroup(): void {
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

  private _attachVisibilityController(): void {
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

  private async _attachRadioButtons(): Promise<void> {
    this.yesRadio = await createDOMNodeReference(`#${this.element.id}_1`);
    this.noRadio = await createDOMNodeReference(`#${this.element.id}_0`);
  }

  /**
   * Sets up an event listener based on the specified event type, executing the specified
   * event handler
   * @param {string} eventType - The DOM event to watch for
   * @param {(e: Event) => void} eventHandler - The callback function that runs when the
   * specified event occurs
   * @returns - Instance of this
   */
  public on(
    eventType: string,
    eventHandler: (e: Event) => void
  ): DOMNodeReference {
    this.element.addEventListener(eventType, eventHandler.bind(this));
    return this;
  }

  /**
   * Hides the element by setting its display style to "none".
   * @returns - Instance of this
   */
  public hide(): DOMNodeReference {
    this.visibilityController.style.display = "none";
    return this;
  }

  /**
   * Shows the element by restoring its default display style.
   * @returns - Instance of this
   */
  public show(): DOMNodeReference {
    this.visibilityController.style.display = this.defaultDisplay;
    return this;
  }

  /**
   *
   * @param {function(instance: DOMNodeReference): boolean | boolean} shouldShow - Either a function that returns true or false,
   * or a natural boolean to determine the visibility of this
   * @returns - Instance of this
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
   * @param {(() => any) | any} value - The value to set for the HTML element.
   * for parents of boolean radios, pass true or false as value, or
   * an expression returning a boolean
   * @returns - Instance of this
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
   * @returns - Instance of this
   */
  public disable(): DOMNodeReference {
    try {
      (this.element as HTMLInputElement).disabled = true;
    } catch (e) {
      throw new Error(
        `There was an error trying to disable the target: ${this.target}`
      );
    }
    return this;
  }

  /**
   * Clears all values and states of the element.
   * Handles different input types appropriately.
   *
   * @returns {DOMNodeReference} Instance of this for method chaining
   * @throws {Error} If clearing values fails
   */
  public async clearValues(): Promise<DOMNodeReference> {
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
          const clearPromises = childInputs.map(async (input) => {
            // Assuming createDOMNodeReference is imported and available
            const inputRef = await createDOMNodeReference(input as HTMLElement);
            return inputRef.clearValues();
          });

          await Promise.all(clearPromises);
        }
      }

      // Handle radio button group if present
      if (
        this.yesRadio instanceof DOMNodeReference &&
        this.noRadio instanceof DOMNodeReference
      ) {
        await this.yesRadio.clearValues();
        await this.noRadio.clearValues();
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
   * @returns - Instance of this
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
   * @param {...HTMLElement} elements - The elements to prepend to the element targeted by this.
   * @returns - Instance of this
   */
  public prepend(...elements: HTMLElement[]): DOMNodeReference {
    this.element.prepend(...elements);
    return this;
  }

  /**
   * Appends child elements to the HTML element.
   * @param {...HTMLElement} elements - The elements to append to the element targeted by this.
   * @returns - Instance of this
   */
  public append(...elements: HTMLElement[]): DOMNodeReference {
    this.element.append(...elements);
    return this;
  }

  /**
   * Inserts elements before the HTML element.
   * @param {...HTMLElement} elements - The elements to insert before the HTML element.
   * @returns - Instance of this
   */
  public before(...elements: HTMLElement[]): DOMNodeReference {
    this.element.before(...elements);
    return this;
  }

  /**
   * Inserts elements after the HTML element.
   * @param {...HTMLElement} elements - The elements to insert after the HTML element.
   * @returns - Instance of this
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
   * Appends child elements to the label associated with the HTML element.
   * @param {...HTMLElement} elements - The elements to append to the label.
   * @returns - Instance of this
   */
  public appendToLabel(...elements: HTMLElement[]): DOMNodeReference {
    const label = this.getLabel();
    if (label) {
      label.append(" ", ...elements);
    }
    return this;
  }

  /**
   * Adds a tooltip with specified text to the label associated with the HTML element.
   * @param {string} text - The text to display in the tooltip.
   * @returns - Instance of this
   */
  public addLabelTooltip(text: string): DOMNodeReference {
    this.appendToLabel(createInfoEl(text));
    return this;
  }

  /**
   * Adds a tooltip with the specified text to the element
   * @param {string} text - The text to display in the tooltip
   * @returns - Instance of this
   */
  public addTooltip(text: string): DOMNodeReference {
    this.append(createInfoEl(text));
    return this;
  }

  /**
   * Sets the inner HTML content of the HTML element.
   * @param {string} string - The text to set as the inner HTML of the element.
   * @returns - Instance of this
   */
  setInnerHTML(string: string) {
    this.element.innerHTML = string;
    return this;
  }

  /**
   * Removes this element from the DOM
   * @returns - Instance of this
   */
  remove() {
    this.element.remove();
    return this;
  }

  /**
   *
   * @param {Partial<CSSStyleDeclaration} options and object containing the styles you want to set : {key: value} e.g.: {'display': 'block'}
   * @returns - Instance of this
   */
  setStyle(options: Partial<CSSStyleDeclaration>) {
    if (Object.prototype.toString.call(options) !== "[object Object]") {
      throw new Error(
        `powerpagestoolkit: 'DOMNodeReference.setStyle' required options to be in the form of an object. Argument passed was of type: ${typeof options}`
      );
    }

    for (const key in options) {
      this.element.style[key as any] = options[key] as string;
    }
    return this;
  }

  /**
   * Unchecks both the yes and no radio buttons if they exist.
   * @returns - Instance of this
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
   * @param {() => boolean} condition - A function that returns a boolean to determine
   * the visibility of the target element. If `condition()` returns true, the element is shown;
   * otherwise, it is hidden.
   * @param {Array<DOMNodeReference>} [dependencies] - An array of `DOMNodeReference` instances. Event listeners are
   * registered on each to toggle the visibility of the target element based on the `condition` and the visibility of
   * the target node.
   * @throws {ConditionalRenderingError} When there's an error in setting up conditional rendering
   * @returns {DOMNodeReference} - Instance of this
   */
  public configureConditionalRendering(
    condition: () => boolean,
    dependencies?: Array<DOMNodeReference>
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

      // Setup observers and event listeners
      dependencies.forEach((node) => {
        if (!node || !(node instanceof DOMNodeReference)) {
          throw new TypeError(
            "Each dependency must be a valid DOMNodeReference instance"
          );
        }

        // Handle change events
        const handleChange = () => {
          try {
            this.toggleVisibility(condition());

            // if an element gets hidden, the value should be wiped
            if (condition() === false) {
              this.clearValues();
            }
          } catch (error) {
            console.error("Error in change handler:", error);
            // Optionally propagate error or handle differently
          }
        };

        node.on("change", handleChange);

        // Setup visibility observer
        const observer = new MutationObserver(() => {
          try {
            const display = window.getComputedStyle(
              node.visibilityController
            ).display;
            this.toggleVisibility(display !== "none" && condition());
          } catch (error) {
            0;
            console.error("Error in mutation observer:", error);
            observer.disconnect();
          }
        });

        observer.observe(node.visibilityController, {
          attributes: true,
          attributeFilter: ["style"],
        });
      });

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
   * @param {() => boolean} isRequired - Function determining if field is required
   * @param {() => boolean} isValid - Function validating field input
   * @param {string} fieldDisplayName - Display name for error messages
   * @param {Array<DOMNodeReference>} dependencies - Fields that trigger requirement/validation updates
   * @returns {DOMNodeReference} Instance of this for method chaining
   * @throws {ValidationConfigError} If validation setup fails
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
      this._setupDependencyTracking(isRequired, dependencies);
    } catch (error: any) {
      throw new ValidationConfigError(
        this,
        `Failed to configure validation: ${error}`
      );
    }

    return this;
  }

  /**
   * Sets up tracking for dependent fields using both event listeners and mutation observers.
   * @private
   */
  private _setupDependencyTracking(
    isRequired: (instance: DOMNodeReference) => boolean,
    dependencies: Array<DOMNodeReference>
  ): void {
    if (dependencies.length === 0) {
      console.warn(
        `powerpagestoolkit: No dependencies specified for ${this.element.id}. ` +
          "Include all referenced nodes in the dependency array for proper validation."
      );
      return;
    }

    dependencies.forEach((dep) => {
      // Handle value changes
      dep.on("change", () => this.setRequiredLevel(isRequired(this)));
      dep.on("input", () => this.setRequiredLevel(isRequired(this)));

      // Handle visibility changes
      const observer = new MutationObserver(() => {
        const display = window.getComputedStyle(
          dep.visibilityController
        ).display;
        if (display !== "none") {
          this.setRequiredLevel(isRequired(this));
        }
      });

      observer.observe(dep.visibilityController, {
        attributes: true,
        attributeFilter: ["style"],
        subtree: false,
      });

      // Handle radio button changes if applicable
      if (dep.yesRadio || dep.noRadio) {
        [dep.yesRadio, dep.noRadio].forEach((radio) => {
          radio?.on("change", () => this.setRequiredLevel(isRequired(this)));
        });
      }
    });
  }

  /**
   * Sets the required level for the field by adding or removing the "required-field" class on the label.
   *
   * @param {Function | boolean} isRequired - Determines whether the field should be marked as required.
   * If true, the "required-field" class is added to the label; if false, it is removed.
   * @returns - Instance of this
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
   * @param {Function} callback - A callback function to execute once the element is loaded.
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
  }
}
