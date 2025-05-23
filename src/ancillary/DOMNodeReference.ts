import type EventManager from "../ancillary/EventManager.ts";
import type ValueManager from "../ancillary/ValueManager.ts";
import type VisibilityManager from "./VisibilityManager.ts";
import { EventTypes } from "../constants/EventTypes.ts";
import { init, destroy } from "../constants/symbols.ts";
import InfoElement from "./InfoElement.ts";
import waitFor from "../core/waitFor.ts";
import Errors from "../errors/errors.ts";
import DOMPurify from "DOMPurify";

export default abstract class DOMNodeReference {
  // declare static properties
  static instances: DOMNodeReference[] = [];

  // allow for indexing methods with symbols
  [key: symbol]: (...arg: any[]) => any;

  // properties initialized in the constructor
  public target: Element | string;
  public logicalName?: string;
  public root: Element;
  protected timeoutMs: number;
  protected isLoaded: boolean;

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

  public set defaultDisplay(newValue: string | null) {
    this.visibilityManager!.defaultDisplay = newValue;
  }

  /**
   * The element targeted when instantiating DOMNodeReference.
   * Made available in order to perform normal DOM traversal,
   * or access properties not available through this class.
   */
  public declare element: HTMLElement;
  public visibilityManager!: VisibilityManager | null;
  public valueManager!: ValueManager | null;
  public eventManager!: EventManager | null;

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

    // The rest of initialization.
  }

  protected async [init](): Promise<void> {
    if (this.target instanceof HTMLElement) {
      this.element = this.target;
    } else {
      this.element = (await waitFor(
        this.target as string,
        this.root,
        false,
        this.timeoutMs
      )) as HTMLElement;
    }

    if (!this.element) {
      throw new Errors.NodeNotFoundError(this);
    }
  }

  // force extensions of this class to implement these methods
  protected abstract initValueManager(): void;
  protected abstract initVisibilityManager(): void;
  protected abstract initEventManager(): void;

  protected _extractLogicalName(target: Element | string): string {
    if (typeof target !== "string") return "";

    const bracketMatch = target.match(/\[([^\]]+)\]/);
    if (!bracketMatch) return target.replace(/[#\[\]]/g, "");

    const content = bracketMatch[1];
    const quoteMatch = content.match(/["']([^"']+)["']/);
    return (quoteMatch?.[1] || content).replace(/[#\[\]]/g, "");
  }

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

  protected _determineEventType(): keyof GlobalEventHandlersEventMap {
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

    this.valueManager!.element = dateNode;

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
  public on<K extends keyof GlobalEventHandlersEventMap>(
    eventType: K,
    eventHandler: (
      this: DOMNodeReference,
      e: GlobalEventHandlersEventMap[K]
    ) => void
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

    const handler = eventHandler as (this: DOMNodeReference, e: Event) => void;
    this.eventManager!.registerDOMEventListener(
      this.element,
      eventType,
      handler.bind(this)
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
    shouldShow: EvaluationFunction | boolean
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
    const safeHTML = DOMPurify.sanitize(innerHTML);
    this.getLabel()?.append(
      new InfoElement(safeHTML, containerStyle || undefined)
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
    const safeHTML = DOMPurify.sanitize(innerHTML);
    this.append(new InfoElement(safeHTML, containerStyle || undefined));
    return this;
  }

  /**
   * Sets the inner HTML content of the HTML element.
   * @param string - The text to set as the inner HTML of the element.
   * @returns - Instance of this [provides option to method chain]
   */
  set innerHTML(innerHTML: string) {
    const safeHTML = DOMPurify.sanitize(innerHTML);
    this.element.innerHTML = safeHTML;
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
  public setStyle(options: Partial<CSSStyleDeclaration>): DOMNodeReference {
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

  // #region Apply Business Rule
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
    try {
      // Create validator if needed (this is only needed once during setup)
      if (rule.setRequirements) {
        this._setupRequirementsValidator(rule.setRequirements());
      }

      // Apply the rules immediately
      const handler = this._createBusinessRuleHandler(rule);
      handler();

      // Setup dependency tracking
      if (dependencies.length) {
        this._configureDependencyTracking(handler, dependencies);
      }

      return this;
    } catch (error) {
      if (error instanceof Error) throw error;
      else throw new Errors.BusinessRuleError(this);
    }
  }
  // #region =========

  private _setupRequirementsValidator(
    requirements: FieldValidationRules
  ): void {
    const { isRequired, isValid } = requirements;

    if (typeof Page_Validators === "undefined") {
      throw new Errors.Page_ValidatorsNotFoundError(this);
    }

    let evaluationFunction = () => true;

    if (isRequired && isValid) {
      evaluationFunction = () => {
        const isFieldRequired = isRequired.call(this);
        const isFieldVisible = this.visibilityManager!.getVisibility();
        return (
          !isFieldRequired ||
          (isFieldVisible && isValid.call(this, isFieldRequired))
        );
      };
    } else if (isValid) {
      evaluationFunction = () => {
        const isFieldVisible = this.visibilityManager!.getVisibility();
        return isFieldVisible && isValid.call(this, false);
      };
    } else if (isRequired) {
      evaluationFunction = () => {
        const isFieldVisible = this.visibilityManager!.getVisibility();
        return isFieldVisible && isRequired.call(this);
      };
    }

    this._createValidator(evaluationFunction);
  }

  private _createBusinessRuleHandler(rule: BusinessRule): BusinessRuleHandler {
    return (): void => {
      let clearValues: boolean = false;

      // Handle visibility
      if (rule.setVisibility) {
        const visibilityCondition = rule.setVisibility;
        const isVisible = visibilityCondition.call(this);
        clearValues = !isVisible;
        this.toggleVisibility(isVisible);
      }

      // Handle requirements
      if (rule.setRequirements && rule.setRequirements().isRequired) {
        const { isRequired } = rule.setRequirements();
        this.setRequiredLevel(isRequired!.call(this));
      }

      // Handle value setting
      if (rule.setValue) {
        const { condition, value } = rule.setValue();
        if (condition.call(this)) {
          const finalValue = value instanceof Function ? value() : value;
          this.setValue.call(this, finalValue);
        }
      }

      // Handle disabled state
      if (rule.setDisabled) {
        const disabledCondition = rule.setDisabled;
        disabledCondition.call(this) ? this.disable() : this.enable();
      }

      // Clear values if needed
      if (clearValues && !rule.setValue) {
        this.clearValue();
      }

      this.triggerDependentsHandlers();
    };
  }

  private _createValidator(evaluationFunction: EvaluationFunction): void {
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
      evaluationfunction: evaluationFunction.bind(this),
    });

    if (Page_Validators == undefined)
      throw new Errors.Page_ValidatorsNotFoundError(this);

    Page_Validators.push(newValidator);
  }

  private _configureDependencyTracking(
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
    isRequired: EvaluationFunction | boolean
  ): DOMNodeReference {
    if (isRequired instanceof Function) {
      isRequired.call(this)
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
  public onceLoaded(callback: (instance: DOMNodeReference) => any): void {
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
