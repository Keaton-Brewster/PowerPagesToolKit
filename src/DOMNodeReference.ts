import waitFor from "@/waitFor.js";
import createInfoEl from "@/createInfoElement.js";
import {
  DOMNodeInitializationError,
  DOMNodeNotFoundError,
  ConditionalRenderingError,
} from "@/errors.js";
import { createDOMNodeReference } from "@/createDOMNodeReferences.js";

export const _init = Symbol("_init");

/******/ /******/ /******/ export default class DOMNodeReference {
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

  // Function to update this.value based on element type
  private _initValueSync() {
    // Initial sync
    this.updateValue();

    // Event listeners for real-time changes based on element type
    const elementType = (this.element as HTMLInputElement).type;
    if (elementType === "checkbox" || elementType === "radio") {
      this.element.addEventListener("click", this.updateValue.bind(this));
    } else if (
      elementType === "select-one" ||
      elementType === "select" ||
      elementType === "select-multiple"
    ) {
      this.element.addEventListener("change", this.updateValue.bind(this));
    } else {
      this.element.addEventListener("input", this.updateValue.bind(this));
    }
  }

  public updateValue(): void {
    switch ((this.element as any).type) {
      case "checkbox":
      case "radio":
        this.value = (this.element as HTMLInputElement).checked;
        this.checked = (this.element as HTMLInputElement).checked;
        break;
      case "select-multiple":
        this.value = Array.from(
          (this.element as HTMLSelectElement).selectedOptions
        ).map((option) => option.value);
        break;
      case "number":
        this.value =
          (this.element as HTMLInputElement).value !== ""
            ? Number((this.element as HTMLInputElement).value)
            : null;
        break;
      default:
        this.value = (this.element as any).value;
        break;
    }

    if (this.element.classList.contains("boolean-radio")) {
      (this.yesRadio as DOMNodeReference).updateValue();
      (this.noRadio as DOMNodeReference).updateValue();
    }

    this._observeValueChanges();
  }

  // Add a method to observe value changes using MutationObserver
  private _observeValueChanges(): void {
    const observer = new MutationObserver(() => {
      this.updateValue();
    });

    observer.observe(this.element, {
      attributes: true,
      attributeFilter: ["value"],
    });
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
   * @param {(this: DOMNodeReference, e: Event) => void} eventHandler - The callback function that runs when the
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
   * @param {function(this: DOMNodeReference): boolean | boolean} shouldShow - Either a function that returns true or false,
   * or a natural boolean to determine the visibility of this
   * @returns - Instance of this
   */
  public toggleVisibility(shouldShow: Function | boolean): DOMNodeReference {
    if (shouldShow instanceof Function) {
      shouldShow(this) ? this.show() : this.hide();
    } else {
      shouldShow ? this.show() : this.hide();
    }
    return this;
  }

  /**
   * Sets the value of the HTML element.
   * @param {() => any} value - The value to set for the HTML element.
   * for parents of boolean radios, pass true or false as value, or
   * an expression returning a boolean
   * @returns - Instance of this
   */
  public setValue(value: any): DOMNodeReference {
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
   * @param {(this: DOMNodeReference) => boolean} condition - A function that returns a boolean to determine
   * the visibility of the target element. If `condition()` returns true, the element is shown;
   * otherwise, it is hidden.
   * @param {Array<DOMNodeReference>} [dependencies] - An array of `DOMNodeReference` instances. Event listeners are
   * registered on each to toggle the visibility of the target element based on the `condition` and the visibility of
   * the target node.
   * @returns - Instance of this
   */
  public configureConditionalRendering(
    condition: () => boolean,
    dependencies: Array<DOMNodeReference>
  ): DOMNodeReference {
    try {
      this.toggleVisibility(condition());

      if (!dependencies) {
        console.warn(
          `powerpagestoolkit: No dependencies were found when configuring conditional rendering for ${this}. Be sure that if you are referencing other nodes in your rendering logic, that you include those nodes in the dependency array`
        );
        return this;
      }

      dependencies.forEach((node) => {
        node.on("change", () => this.toggleVisibility(condition()));

        const observer = new MutationObserver(() => {
          const display = window.getComputedStyle(
            node.visibilityController
          ).display;
          this.toggleVisibility(display !== "none" && condition());
        });
        observer.observe(node.visibilityController, {
          attributes: true,
          attributeFilter: ["style"],
        });
      });

      return this;
    } catch (e) {
      throw new ConditionalRenderingError(this, e as string);
    }
  }

  /**
   * Sets up validation and requirement rules for the field. This function dynamically updates the field's required status and validates its input based on the specified conditions.
   *
   * @param {function(this: DOMNodeReference): boolean} isRequired - A function that determines whether the field should be required. Returns `true` if required, `false` otherwise.
   * @param {function(this: DOMNodeReference): boolean} isValid - A function that checks if the field's input is valid. Returns `true` if valid, `false` otherwise.
   * @param {string} fieldDisplayName - The name of the field, used in error messages if validation fails.
   * @param {Array<DOMNodeReference>} [dependencies] Other fields that this field’s requirement depends on. When these fields change, the required status of this field is re-evaluated. Make sure any DOMNodeReference used in `isRequired` or `isValid` is included in this array.
   * @returns - Instance of this
   */
  public configureValidationAndRequirements(
    isRequired: (instance: DOMNodeReference) => boolean,
    isValid: (instance: DOMNodeReference) => boolean,
    fieldDisplayName: string,
    dependencies: Array<DOMNodeReference>
  ): DOMNodeReference {
    if (typeof Page_Validators !== "undefined") {
      const newValidator = document.createElement("span");
      newValidator.style.display = "none";
      newValidator.id = `${this.element.id}Validator`;
      (newValidator as any).controltovalidate = this.element.id;
      (
        newValidator as any
      ).errormessage = `<a href='#${this.element.id}_label'>${fieldDisplayName} is a required field</a>`;
      (newValidator as any).evaluationfunction = isValid.bind(this);
      //eslint-disable-next-line
      Page_Validators.push(newValidator);
    } else {
      throw new Error(
        "Attempted to add to Validator where Page_Validators do not exist"
      );
    }

    this.setRequiredLevel(isRequired(this));

    if (!dependencies) {
      console.warn(
        `powerpagestoolkit: No dependencies were found when configuring requirement and validation for ${this}. Be sure that if you are referencing other nodes in your requirement or validation logic, that you include those nodes in the dependency array`
      );
      return this;
    }
    dependencies.forEach((dep) => {
      dep.element.addEventListener("change", () =>
        this.setRequiredLevel(isRequired(this))
      );
    });

    return this;
  }

  /**
   * Sets the required level for the field by adding or removing the "required-field" class on the label.
   *
   * @param {boolean} isRequired - Determines whether the field should be marked as required.
   * If true, the "required-field" class is added to the label; if false, it is removed.
   * @returns - Instance of this
   */
  public setRequiredLevel(isRequired: Function | boolean): DOMNodeReference {
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
