/// <reference path="../globals.d.ts" />
import * as s from "../constants/symbols.d.ts";
export default class DOMNodeReference {
    target: Element | string;
    logicalName?: string;
    root: Element;
    protected [s.debounceTime]: number;
    protected isLoaded: boolean;
    protected defaultDisplay: string;
    protected [s.observers]: Array<MutationObserver>;
    protected [s.boundEventListeners]: Array<BoundEventListener>;
    protected isRadio: boolean;
    protected radioType: RadioType | null;
    /**
     * The value of the element that this node represents
     * stays in syncs with the live DOM elements?.,m  via event handler
     */
    value: any;
    /**
     * The element targeted when instantiating DOMNodeReference.
     * Made available in order to perform normal DOM traversal,
     * or access properties not available through this class.
     */
    element: HTMLElement;
    protected visibilityController: HTMLElement;
    checked: boolean;
    /**
     * Represents the 'yes' option of a boolean radio field.
     * This property is only available when the parent node
     * is a main field for a boolean radio input.
     */
    yesRadio: DOMNodeReference | null;
    /**
     * Represents the 'no' option of a boolean radio field.
     * This property is only available when the parent node
     * is a main field for a boolean radio input.
     */
    noRadio: DOMNodeReference | null;
    /**
     * Creates an instance of DOMNodeReference.
     * @param target - The CSS selector to find the desired DOM element.
     * @param root - Optionally specify the element within to search for the element targeted by 'target'
     * Defaults to 'document.body'
     */
    /******/ /******/ constructor(target: Element | string, root: Element | undefined, debounceTime: number);
    private extractLogicalName;
    [s.init](): Promise<void>;
    /**
     * Initializes value synchronization with appropriate event listeners
     * based on element type.
     */
    protected [s.valueSync](): void;
    private determineEventType;
    private isDateInput;
    protected [s.isValidFormElement](element: Element): element is FormElement;
    protected [s.registerEventListener](element: Element, eventType: keyof HTMLElementEventMap, handler: (e: Event) => unknown): void;
    protected [s.dateSync](element: HTMLInputElement): Promise<void>;
    /**
     * Gets the current value of the element based on its type
     * @protected
     * @returns Object containing value and optional checked state
     */
    protected [s.getElementValue](): ElementValue;
    protected [s.attachVisibilityController](): void;
    protected [s.attachRadioButtons](): Promise<void>;
    protected [s.bindMethods](): void;
    protected [s.destroy](): void;
    /**
     * Updates the value and checked state based on element type
     * @public
     */
    updateValue(e?: Event): void;
    /**
     * Sets up an event listener based on the specified event type, executing the specified
     * event handler
     * @param eventType - The DOM event to watch for
     * @param eventHandler - The callback function that runs when the
     * specified event occurs.
     * @returns - Instance of this [provides option to method chain]
     */
    on(eventType: keyof HTMLElementEventMap, eventHandler: (e: Event) => void): DOMNodeReference;
    /**
     * Hides the element by setting its display style to "none".
     * @returns - Instance of this [provides option to method chain]
     */
    hide(): DOMNodeReference;
    /**
     * Shows the element by restoring its default display style.
     * @returns - Instance of this [provides option to method chain]
     */
    show(): DOMNodeReference;
    /**
     * @param shouldShow - Either a function that returns true or false,
     * or a natural boolean to determine the visibility of this
     * @returns - Instance of this [provides option to method chain]
     */
    toggleVisibility(shouldShow: ((instance: DOMNodeReference) => boolean) | boolean): DOMNodeReference;
    /**
     * Sets the value of the HTML element.
     * @param value - The value to set for the HTML element.
     * for parents of boolean radios, pass true or false as value, or
     * an expression returning a boolean
     * @returns - Instance of this [provides option to method chain]
     */
    setValue(value: (() => any) | any): DOMNodeReference;
    /**
     * Disables the element so that users cannot input any data
     * @returns - Instance of this [provides option to method chain]
     */
    disable(): DOMNodeReference;
    /**
     * Clears all values and states of the element.
     * Handles different input types appropriately, and can be called
     * on an element containing N child inputs to clear all
     *
     * @returns - Instance of this [provides option to method chain]
     * @throws If clearing values fails
     */
    clearValue(): Promise<DOMNodeReference>;
    /**
     * Enables the element so that users can input data
     * @returns - Instance of this [provides option to method chain]
     */
    enable(): DOMNodeReference;
    /**
     * @param elements - The elements to prepend to the element targeted by this.
     * @returns - Instance of this [provides option to method chain]
     */
    prepend(...elements: HTMLElement[]): DOMNodeReference;
    /**
     * Appends child elements to the HTML element.
     * @param elements - The elements to append to the element targeted by this.
     * @returns - Instance of this [provides option to method chain]
     */
    append(...elements: HTMLElement[]): DOMNodeReference;
    /**
     * Inserts elements before the HTML element.
     * @param elements - The elements to insert before the HTML element.
     * @returns - Instance of this [provides option to method chain]
     */
    before(...elements: HTMLElement[]): DOMNodeReference;
    /**
     * Inserts elements after the HTML element.
     * @param elements - The elements to insert after the HTML element.
     * @returns - Instance of this [provides option to method chain]
     */
    after(...elements: HTMLElement[]): DOMNodeReference;
    /**
     * Retrieves the label associated with the HTML element.
     * @returns {HTMLElement} The label element associated with this element.
     */
    getLabel(): HTMLElement | null;
    /**
     * Adds a tooltip with specified text to the label associated with the HTML element.
     * @param innerHTML - The innerHTML to append into the tooltip.
     * @param containerStyle - Optional object with CSS Styles to apply to the info element
     * @returns - Instance of this [provides option to method chain]
     */
    addLabelTooltip(innerHTML: string, containerStyle?: Partial<CSSStyleDeclaration>): DOMNodeReference;
    /**
     * Adds a tooltip with the specified text to the element
     * @param innerHTML - The innerHTML to append into the tooltip
     * @param containerStyle - Optional object with CSS Styles to apply to the info element
     * @returns - Instance of this [provides option to method chain]
     */
    addTooltip(innerHTML: string, containerStyle?: Partial<CSSStyleDeclaration>): DOMNodeReference;
    /**
     * Sets the inner HTML content of the HTML element.
     * @param {string} string - The text to set as the inner HTML of the element.
     * @returns - Instance of this [provides option to method chain]
     */
    setInnerHTML(string: string): this;
    /**
     * Removes this element from the DOM
     * @returns - Instance of this [provides option to method chain]
     */
    remove(): this;
    /**
     * @param options and object containing the styles you want to set : {key: value} e.g.: {'display': 'block'}
     * @returns - Instance of this [provides option to method chain]
     */
    setStyle(options: Partial<CSSStyleDeclaration>): this;
    /**
     * Unchecks both the yes and no radio buttons if they exist.
     * @returns - Instance of this [provides option to method chain]
     */
    uncheckRadios(): DOMNodeReference;
    /**
     * Applies a business rule to manage visibility, required state, value, and disabled state dynamically.
     * @see {@link BusinessRule}
     * @param rule The business rule containing conditions for various actions.
     * @param dependencies For re-evaluation conditions when the state of the dependencies change
     * @returns Instance of this for method chaining.
     */
    applyBusinessRule(rule: BusinessRule, dependencies: DOMNodeReference[]): DOMNodeReference;
    /**
     * Configures conditional rendering for the target element based on a condition
     * and the visibility of one or more trigger elements.
     * @deprecated Use the new 'applyBusinessRule Method
     * @param condition A function that returns a boolean to determine
     * the visibility of the target element. If `condition()` returns true, the element is shown;
     * otherwise, it is hidden.
     * @param dependencies - An array of `DOMNodeReference` instances. Event listeners are
     * registered on each to toggle the visibility of the target element based on the `condition` and the visibility of
     * the target node.
     * @throws When there's an error in setting up conditional rendering
     * @returns Instance of this [provides option to method chain]
     */
    configureConditionalRendering(condition: () => boolean, dependencies?: Array<DOMNodeReference>, clearValuesOnHide?: boolean): DOMNodeReference;
    /**
     * Sets up validation and requirement rules for the field with enhanced error handling and dynamic updates.
     * @deprecated Use the new 'applyBusinessRule Method
     * @param isRequired Function determining if field is required
     * @param isValid Function validating field input
     * @param fieldDisplayName Display name for error messages
     * @param dependencies Fields that trigger requirement/validation updates
     * @returns Instance of this
     * @throws If validation setup fails
     */
    configureValidationAndRequirements(isRequired: () => boolean, isValid: () => boolean, fieldDisplayName: string, dependencies: Array<DOMNodeReference>): DOMNodeReference;
    /**
     * Sets up tracking for dependencies using both event listeners and mutation observers.
     * @protected
     * @param handler The function to execute when dependencies change
     * @param dependencies Array of dependent DOM nodes to track
     * @param options Additional configuration options. clearValuesOnHide defaults to false.
     * all other options defaults to true
     */
    protected _configDependencyTracking(handler: () => void, dependencies: Array<DOMNodeReference>, options?: {
        clearValuesOnHide?: boolean;
        observeVisibility?: boolean;
        trackInputEvents?: boolean;
        trackRadioButtons?: boolean;
    }): void;
    /**
     * Sets the required level for the field by adding or removing the "required-field" class on the label.
     *
     * @param isRequired Determines whether the field should be marked as required.
     * If true, the "required-field" class is added to the label; if false, it is removed.
     * @returns Instance of this [provides option to method chain]
     */
    setRequiredLevel(isRequired: (() => boolean) | boolean): DOMNodeReference;
    /**
     * Executes a callback function once the element is fully loaded.
     * If the element is already loaded, the callback is called immediately.
     * Otherwise, a MutationObserver is used to detect when the element is added to the DOM.
     * @param callback A callback function to execute once the element is loaded.
     * Receives instance of 'this' as an argument
     */
    onceLoaded(callback: (instance: DOMNodeReference) => any): any;
}
