import { waitFor } from "./common_functions.js";
import FieldValidation from "./FieldValidation.class.js";
import createInfoEl from "./createInfoElement.js";

/**
 * Class representing a reference to a DOM node.
 */
class DOMNodeReference {
  /**
   * Creates an instance of DOMNodeReference.
   * @param {string} querySelector - The CSS selector to find the desired DOM element.
   */
  constructor(querySelector) {
    this.querySelector = querySelector;
    this.element = null;
    this.isLoaded = false;
    // Deferred initialization
  }

  /**
   * Initializes the DOMNodeReference instance by waiting for the element to be available in the DOM.
   * @returns {Promise<Proxy>} A promise that resolves to a Proxy of the DOMNodeReference instance.
   * @throws {Error} Throws an error if the element cannot be found using the provided query selector.
   */
  async init() {
    const element = await waitFor(this.querySelector);
    if (!element) {
      throw new Error(
        `[SYNACT] No Element could be found with the provided query selector: ${this.querySelector}`
      );
    }

    this.element = element;
    this.parentElement = element.parentElement;
    this.container = element.parentElement.parentElement.parentElement;
    this.isLoaded = true;

    if (this.element.classList.contains("boolean-radio")) {
      this.yesRadio = new DOMNodeReference(`#${this.element.id}_1`);
      this.noRadio = new DOMNodeReference(`#${this.element.id}_0`);
    }

    this.defaultDisplay = this.element.style.display || "block";
    this.defaultParentDisplay = this.parentElement.style.display || "block";
    this.defaultContainerDisplay = this.container.style.display || "block";

    return new Proxy(this, {
      get: (target, prop) => {
        const value = target[prop];
        if (typeof value === "function" && prop !== "onceLoaded") {
          return (...args) =>
            target.onceLoaded(() => value.apply(target, args));
        }
        return value;
      },
    });
  }

  /**
   * Hides the element by setting its display style to "none".
   * @method hide
   */
  hide() {
    this.element.style.display = "none";
  }

  /**
   * Shows the element by restoring its default display style.
   * @method show
   */
  show() {
    this.element.style.display = this.defaultDisplay;
  }

  /**
   * Hides the parent element by setting its display style to "none".
   * @method hideParent
   */
  hideParent() {
    this.parentElement.style.display = "none";
  }

  /**
   * Shows the parent element by restoring its default display style.
   * @method showParent
   */
  showParent() {
    this.parentElement.style.display = this.defaultParentDisplay;
  }

  /**
   * Hides the container (grandparent of the element) by setting its display style to "none".
   * @method hideContainer
   */
  hideContainer() {
    this.element.parentElement.parentElement.parentElement.style.display =
      "none";
  }

  /**
   * Shows the container (grandparent of the element) by restoring its default display style.
   * @method showContainer
   */
  showContainer() {
    this.element.parentElement.parentElement.parentElement.style.display =
      this.defaultContainerDisplay;
  }

  /**
   * Sets the value of the HTML element.
   * @method setValue
   * @param {string} value - The value to set for the HTML element.
   */
  setValue(value) {
    this.element.value = value;
  }

  /**
   * Gets the value of the HTML element.
   * @method getValue
   * @returns {string} The current value of the HTML element.
   */
  getValue() {
    return this.element.value;
  }

  /**
   * Appends child elements to the HTML element.
   * @method append
   * @param {...HTMLElement} elements - The elements to append to the HTML element.
   */
  append(...elements) {
    this.element.append(...elements);
  }

  /**
   * Inserts elements after the HTML element.
   * @method after
   * @param {...HTMLElement} elements - The elements to insert after the HTML element.
   */
  after(...elements) {
    this.element.after(...elements);
  }

  /**
   * Retrieves the label associated with the HTML element.
   * @method getLabel
   * @returns {HTMLElement} The label element associated with this element.
   * @throws {Error} Throws an error if the label cannot be found.
   */
  getLabel() {
    return document.querySelector(`#${this.element.id}_label`);
  }

  /**
   * Appends child elements to the label associated with the HTML element.
   * @method appendToLabel
   * @param {...HTMLElement} elements - The elements to append to the label.
   */
  appendToLabel(...elements) {
    let label = this.getLabel();
    label.append(" ", ...elements);
  }

  /**
   * Adds a click event listener to the HTML element.
   * @method addClickListener
   * @param {Function} eventHandler - The function to execute when the element is clicked.
   */
  addClickListener(eventHandler) {
    this.element.addEventListener("click", (e) => {
      e.preventDefault();
      eventHandler();
    });
  }

  /**
   * Adds a change event listener to the HTML element.
   * @method addChangeListener
   * @param {Function} eventHandler - The function to execute when the element's value changes.
   */
  addChangeListener(eventHandler) {
    this.element.addEventListener("change", (e) => {
      e.preventDefault();
      eventHandler();
    });
  }

  /**
   * Unchecks both the yes and no radio buttons if they exist.
   * @method uncheckRadios
   */
  uncheckRadios() {
    if (this.yesRadio && this.noRadio) {
      this.yesRadio.element.checked = false;
      this.noRadio.element.checked = false;
    } else {
      console.error(
        "[SYNACT] Attempted to uncheck radios for an element that has no radios"
      );
    }
  }

  /**
   * Creates a validation instance for the field.
   * @method createValidation
   * @param {Function} evaluationFunction - The function used to evaluate the field.
   * @param {string} fieldDisplayName - The field name to display in error if validation fails.
   */
  createValidation(evaluationFunction, fieldDisplayName) {
    new FieldValidation(this.id, `'${fieldDisplayName}'`, evaluationFunction);
  }

  /**
   * Adds a tooltip with specified text to the label associated with the HTML element.
   * @method addLabelTooltip
   * @param {string} text - The text to display in the tooltip.
   */
  addLabelTooltip(text) {
    this.appendToLabel(createInfoEl(text));
  }

  /**
   * Sets the inner HTML content of the HTML element.
   * @method setTextContent
   * @param {string} text - The text to set as the inner HTML of the element.
   */
  setTextContent(text) {
    this.element.innerHTML = text;
  }

  /**
   * Executes a callback function once the element is fully loaded.
   * If the element is already loaded, the callback is called immediately.
   * Otherwise, a MutationObserver is used to detect when the element is added to the DOM.
   * @method onceLoaded
   * @param {Function} callback - A callback function to execute once the element is loaded.
   */
  onceLoaded(callback) {
    console.log("loading element");
    if (this.isLoaded) {
      callback(this);
    } else {
      const observer = new MutationObserver(() => {
        if (document.querySelector(this.querySelector)) {
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
}

/**
 * Creates and initializes a DOMNodeReference instance.
 * @async
 * @function createDOMNodeReference
 * @param {string} querySelector - The CSS selector for the desired DOM element.
 * @returns {Promise<Proxy>} A promise that resolves to a Proxy of the initialized DOMNodeReference instance.
 */
export default async function createDOMNodeReference(querySelector) {
  const instance = new DOMNodeReference(querySelector);
  return await instance.init();
}
