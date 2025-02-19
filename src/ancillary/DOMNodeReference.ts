import type EventManager from "../ancillary/EventManager.ts";
import type VisibilityManager from "../ancillary/VisibilityManager.ts";
import type ValueManager from "../ancillary/ValueManager.ts";

import waitFor from "../core/waitFor.ts";
import createInfoEl from "../utils/createInfoElement.ts";
import { destroy } from "../constants/symbols.ts";
import { EventTypes } from "../constants/EventTypes.ts";
import Errors from "../errors/errors.ts";

export default class DOMNodeReference {
  // declare static properties
  static instances: DOMNodeReference[] = [];

  // allow for indexing methods with symbols
  [key: symbol]: (...arg: any[]) => any;

  // properties initialized in the constructor
  public target: Element | string;
  public logicalName?: string;
  public root: Element;
  //   public isRadio: boolean = false;
  protected timeoutMs: number;
  protected isLoaded: boolean;
  //   protected radioType: RadioType | null = null;

  /**
   * The value of the element that this node represents
   * stays in syncs with the live DOM elements?.,m  via event handler
   */
  public get value() {
    return this.valueManager!.value;
  }

  public set value(newValue) {
    this.valueManager!.setValue(newValue);
  }

  public get checked() {
    return this.valueManager!.checked;
  }
  // public value: any;

  // other properties made available after async s.init

  /**
   * The element targeted when instantiating DOMNodeReference.
   * Made available in order to perform normal DOM traversal,
   * or access properties not available through this class.
   */
  public declare element: HTMLElement;
  public visibilityManager!: VisibilityManager | null;
  public valueManager!: ValueManager | null;
  public eventManager!: EventManager | null;

  //   public declare radioParent: DOMNodeReference | undefined;
  /**
   * Represents the 'yes' option of a boolean radio field.
   * This property is only available when the parent node
   * is a main field for a boolean radio input.
   */
  //   public declare yesRadio: DOMNodeReference | undefined;
  /**
   * Represents the 'no' option of a boolean radio field.
   * This property is only available when the parent node
   * is a main field for a boolean radio input.
   */
  //   public declare noRadio: DOMNodeReference | undefined;

  /**
   * Creates an instance of DOMNodeReference.
   * @param target - The CSS selector to find the desired DOM element.
   * @param root - Optionally specify the element within to search for the element targeted by 'target'
   * Defaults to 'document.body'
   */
  /******/ /******/ constructor(
    target: Element | string,
    root: Element = document.body,
    timeoutMs: number
  ) {
    this.target = target;
    this.logicalName = this._extractLogicalName(target);
    this.root = root;
    this.timeoutMs = timeoutMs;
    this.isLoaded = false;

    // we defer the rest of initialization
  }

  protected _extractLogicalName(target: Element | string): string {
    if (typeof target !== "string") return "";

    const bracketMatch = target.match(/\[([^\]]+)\]/);
    if (!bracketMatch) return target.replace(/[#\[\]]/g, "");

    const content = bracketMatch[1];
    const quoteMatch = content.match(/["']([^"']+)["']/);
    return (quoteMatch?.[1] || content).replace(/[#\[\]]/g, "");
  }

  /**
   * Initializes value synchronization with appropriate event listeners
   * based on element type.
   */
  protected _valueSync(): void {
    if (!this._isValidFormElement(this.element)) return;

    this.updateValue();
    const eventType = this._determineEventType();
    this.eventManager!.registerDOMEventListener(
      this.element,
      eventType,
      this.updateValue.bind(this)
    );

    if (this._isDateInput()) {
      this._dateSync(this.element as HTMLInputElement);
    }
  }

  protected _determineEventType(): keyof HTMLElementEventMap {
    if (this.element instanceof HTMLSelectElement) return "change";
    if (this.element instanceof HTMLTextAreaElement) return "keyup";
    if (!(this.element instanceof HTMLInputElement)) return EventTypes.DEFAULT;

    return (
      EventTypes[this.element.type.toUpperCase() as keyof typeof EventTypes] ||
      EventTypes.DEFAULT
    );
  }

  protected _isDateInput(): boolean {
    return (
      this.element instanceof HTMLInputElement &&
      this.element.dataset.type === "date"
    );
  }

  protected _isValidFormElement(element: Element): element is FormElement {
    return (
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSpanElement ||
      element instanceof HTMLButtonElement ||
      element instanceof HTMLFieldSetElement
    );
  }

  protected async _dateSync(element: HTMLInputElement): Promise<void> {
    const parentElement = element.parentElement;
    if (!parentElement) {
      throw new DOMException("Date input must have a parent element");
    }

    const dateNode = (await waitFor(
      "[data-date-format]",
      parentElement,
      false,
      1500
    )) as HTMLElement;

    this.eventManager!.registerDOMEventListener(
      dateNode,
      "select",
      this.updateValue.bind(this)
    );
  }

  protected _bindMethods() {
    const prototype = Object.getPrototypeOf(this);

    for (const key of Object.getOwnPropertyNames(prototype) as Array<
      keyof this
    >) {
      const value = this[key];

      // Ensure we're binding only functions and skip the constructor
      if (key !== "constructor" && typeof value === "function") {
        this[key] = value.bind(this);
      }
    }
  }

  protected [destroy](): void {
    // Clear other references
    this.isLoaded = false;
    this.value = null;

    this.eventManager!.destroy();
    this.eventManager = null;
    this.visibilityManager!.destroy();
    this.visibilityManager = null;
    this.valueManager!.destroy();
    this.valueManager = null;
  }

  /**
   * Updates the value and checked state based on element type
   * @public
   */
  public async updateValue(e?: Event): Promise<void> {
    if (e && !e.isTrusted) return;
    await this.valueManager!.updateValue(e);
    this.triggerDependentsHandlers();
  }

  protected triggerDependentsHandlers(): void {
    this.eventManager!.dispatchDependencyHandlers();
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
    eventHandler: (this: DOMNodeReference, e: Event) => void
  ): DOMNodeReference {
    if (typeof eventHandler !== "function") {
      throw new Errors.IncorrectParameterError(
        this,
        "on",
        "eventHandler",
        ["function"],
        typeof eventHandler
      );
    }

    this.eventManager!.registerDOMEventListener(
      this.element,
      eventType,
      eventHandler.bind(this)
    );

    return this;
  }

  /**
   * Hides the element by setting its display style to "none".
   * @returns - Instance of this [provides option to method chain]
   */
  public hide(): DOMNodeReference {
    this.visibilityManager!.hide();
    return this;
  }

  /**
   * Shows the element by restoring its default display style.
   * @returns - Instance of this [provides option to method chain]
   */
  public show(): DOMNodeReference {
    this.visibilityManager!.show();
    return this;
  }

  /**
   * @param shouldShow - Either a function that returns true or false,
   * or a natural boolean to determine the visibility of this
   * @returns - Instance of this [provides option to method chain]
   */
  public toggleVisibility(
    shouldShow: ((this: DOMNodeReference) => boolean) | boolean
  ): DOMNodeReference {
    const bool: boolean =
      shouldShow instanceof Function ? shouldShow.call(this) : shouldShow;

    this.visibilityManager!.toggleVisibility(bool);
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
    this.valueManager!.setValue(value);

    return this;
  }

  /**
   * Disables the element so that users cannot input any data
   * @returns - Instance of this [provides option to method chain]
   */
  public disable(): DOMNodeReference {
    (this.element as HTMLInputElement).disabled = true;
    return this;
  }

  /**
   * Clears all values and states of the element.
   * Handles different input types appropriately, and can be called
   * on an element containing N child inputs to clear all
   */
  public clearValue(): void {
    this.valueManager!.clearValue();

    // Handle nested input elements in container elements
    if (this._getChildren()) {
      this.callAgainstChildrenInputs((child) => child.clearValue());
    }
  }

  protected _getChildren(): DOMNodeReference[] | null {
    const childInputs: Element[] = Array.from(
      this.element.querySelectorAll("input, select, textarea")
    );
    const childIds: string[] = childInputs.map((input) => {
      return input.id;
    });

    const children = DOMNodeReference.instances.filter((ref) => {
      return childIds.includes(ref.element.id);
    });

    return children.length > 0 ? children : null;
  }

  protected callAgainstChildrenInputs(
    callback: (child: DOMNodeReference) => any
  ): void {
    // Handle nested input elements in container elements
    const children: DOMNodeReference[] | null = this._getChildren();
    if (!children) {
      console.error("No child inputs found for target: ", this);
      return;
    }

    for (const child of children) {
      callback(child);
    }
  }

  /**
   * Enables the element so that users can input data
   * @returns - Instance of this [provides option to method chain]
   */
  public enable(): DOMNodeReference {
    (this.element as HTMLInputElement).disabled = false;
    return this;
  }

  /**
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
   * @returns The label element associated with this element.
   */
  public getLabel(): HTMLElement | null {
    const label =
      (document.querySelector(`#${this.element.id}_label`) as HTMLElement) ||
      null;
    if (!label) throw new Errors.LabelNotFoundError(this);
    return label;
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
   * @param string - The text to set as the inner HTML of the element.
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
   * Sets inline CSS styles on the element.
   * @param options - An object containing CSS property-value pairs, e.g., { display: 'block' }.
   * @returns The instance, enabling method chaining.
   */
  public setStyle(options: Partial<CSSStyleDeclaration>): this {
    if (options === null || typeof options !== "object") {
      throw new Errors.IncorrectParameterError(
        this,
        "setStyle",
        "options",
        ["Partial<CSSStyleDeclaration>"],
        typeof options
      );
    }

    // Iterate over own enumerable properties of the options object.
    Object.entries(options).forEach(([prop, value]) => {
      // Skip properties that are undefined.
      if (value !== undefined) {
        // Here we cast 'prop' as a key of CSSStyleDeclaration.
        // Using bracket notation allows dynamic property access.
        (this.element.style as any)[prop] = value;
      }
    });

    return this;
  }

  /**
   * Applies a business rule to manage visibility, required state, value, and disabled state dynamically.
   * @see {@link BusinessRule}
   * @param rule The business rule containing conditions for various actions.
   * @param dependencies For re-evaluation of conditions when the state of the dependencies change
   * @returns Instance of this for method chaining.
   */
  public applyBusinessRule(
    rule: BusinessRule,
    dependencies: DependencyArray<DOMNodeReference>
  ): DOMNodeReference {
    // Apply Visibility Rule
    if (rule.setVisibility) {
      const condition = rule.setVisibility;
      const initialState = condition.call(this);
      this.toggleVisibility(initialState);
    }

    // Apply Required & Validation Rule
    if (rule.setRequirements) {
      const { isRequired, isValid } = rule.setRequirements();
      // get args? rule.setRequired(isRequired, isValid)

      if (typeof Page_Validators === "undefined") {
        throw new Errors.Page_ValidatorsNotFoundError(this);
      }

      let evaluationFunction: () => boolean = () => true;

      if (isRequired && isValid) {
        evaluationFunction = () => {
          const isFieldRequired = isRequired.call(this);
          const isFieldVisible = this.visibilityManager!.getVisibility();

          // If the field is not required, it is always valid
          // If the field is required, it must be visible and valid
          return (
            !isFieldRequired ||
            (isFieldVisible && isValid.call(this, isFieldRequired))
          );
        };
      } else if (isValid) {
        evaluationFunction = () => {
          const isFieldVisible = this.visibilityManager!.getVisibility();

          // The field must be visible and valid
          return isFieldVisible && isValid.call(this);
        };
      } else if (isRequired) {
        evaluationFunction = () => {
          const isFieldVisible = this.visibilityManager!.getVisibility();

          // The field must be visible and required
          return isFieldVisible && isRequired.call(this);
        };
      }

      this._createValidator(evaluationFunction);
    }

    // Apply Set Value Rule
    if (rule.setValue) {
      let { condition, value } = rule.setValue();
      if (value instanceof Function) value = value();
      if (condition.call(this)) {
        this.setValue.call(this, value);
      }
    }

    // Apply Disabled Rule
    if (rule.setDisabled) {
      const condition = rule.setDisabled;
      condition.call(this) ? this.disable() : this.enable();
    }

    const handler: BusinessRuleHandler = this._returnBusinessRuleHandler(rule);
    handler();

    // setup dep tracking
    if (dependencies.length) {
      this._configureDependencyTracking(handler, dependencies);
    }

    return this;
  }

  protected _returnBusinessRuleHandler(
    rule: BusinessRule
  ): BusinessRuleHandler {
    return (): void => {
      let clearValues: boolean = false;
      if (rule.setVisibility) {
        const visibilityCondition = rule.setVisibility;
        clearValues = clearValues || !visibilityCondition.call(this);
        this.toggleVisibility(visibilityCondition.call(this));
      }
      if (rule.setRequirements && rule.setRequirements().isRequired) {
        const { isRequired } = rule.setRequirements();
        this.setRequiredLevel(isRequired!.call(this));
      }
      if (rule.setValue) {
        const { condition, value } = rule.setValue();
        if (condition.call(this)) this.setValue.call(this, value);
      }
      if (rule.setDisabled) {
        const disabledCondition = rule.setDisabled;
        disabledCondition.call(this) ? this.disable() : this.enable();
      }

      if (clearValues && !rule.setValue) {
        this.clearValue();
      }

      this.triggerDependentsHandlers();
    };
  }

  protected _createValidator(evaluationFunction: () => boolean): void {
    const fieldDisplayName = (() => {
      let label: any = this.getLabel();
      if (!label) {
        throw new Errors.LabelNotFoundError(this);
      }
      label = label.innerHTML;
      if (label.length > 50) {
        label = label.substring(0, 50) + "...";
      }
      return label;
    })();

    const validatorId = `${this.element.id}Validator`;

    const newValidator = document.createElement("span");
    newValidator.style.display = "none";
    newValidator.id = validatorId;

    Object.assign(newValidator, {
      controltovalidate: this.element.id,
      errormessage: `<a href='#${this.element.id}_label'>${fieldDisplayName} is a required field</a>`,
      evaluationfunction: evaluationFunction,
    });

    if (Page_Validators == undefined)
      throw new Errors.Page_ValidatorsNotFoundError(this);

    Page_Validators.push(newValidator);
  }

  /**
   * Sets up tracking for dependencies using both event listeners and mutation observers.
   * @protected
   * @param handler The function to execute when dependencies change
   * @param dependencies Array of dependent DOM nodes to track
   * all other options defaults to true
   */
  protected _configureDependencyTracking(
    handler: DependencyHandler,
    dependencies: DOMNodeReference[]
  ): void {
    if (dependencies.length < 1) {
      console.error(
        `powerpagestoolkit: No dependencies specified for ${this.element.id}. ` +
          "Include all required nodes in the dependency array for proper tracking."
      );
      return;
    }

    dependencies.forEach((dependency) => {
      if (!dependency || !(dependency instanceof DOMNodeReference)) {
        throw new TypeError(
          "Each dependency must be a valid DOMNodeReference instance"
        );
      }

      // Check for self-referential dependency
      if (dependency.logicalName === this.logicalName) {
        throw new Errors.SelfReferenceError(this);
      }

      // The node that THIS depends on needs to be able to send notifications to its dependents
      // dependency.dependents.set(this, handler.bind(this));
      dependency.eventManager!.registerDependent(this, handler.bind(this));
    });
  }

  /**
   * Sets the required level for the field by adding or removing the "required-field" class on the label.
   *
   * @param isRequired Determines whether the field should be marked as required.
   * If true, the "required-field" class is added to the label; if false, it is removed.
   * @returns Instance of this [provides option to method chain]
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
   * @param callback A callback function to execute once the element is loaded.
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
    const observer = new MutationObserver(
      function (this: DOMNodeReference) {
        if (document.querySelector(this.target as string)) {
          observer.disconnect(); // Stop observing once loaded
          this.isLoaded = true;
          callback(this); // Call the provided callback
        }
      }.bind(this)
    );

    this.eventManager!.registerObserver(observer, {
      nodeToObserve: document.body,
      options: { subtree: true, childList: true },
    });
  }
}
