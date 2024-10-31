import waitFor from "./waitFor.js";
import FieldValidation from "./FieldValidation.class.js";
import createInfoEl from "./createInfoElement.js";

/**
 * Class representing a reference to a DOM node.
 */
/******/ /******/ /******/ class DOMNodeReference {
  /**
   * Creates an instance of DOMNodeReference.
   * @param {string} target - The CSS selector to find the desired DOM element.
   */
  /******/ /******/ constructor(target) {
    this.target = target;
    this.element = null;
    this.isLoaded = false;
    this.visibilityController = null;
    this.defaultDisplay = "";
    this.value = null;
    // we defer the rest of initialization
  }

  /**
   * Initializes the DOMNodeReference instance by waiting for the element to be available in the DOM.
   */
  /******/ /******/ async init() {
    try {
      const element = await waitFor(this.target);
      this.element = element;

      if (!this.element) {
        throw new Error(
          `[SYNACT] No Element could be found with the provided query selector: ${this.target}`
        );
      }

      this.value = this.element.value;

      if (this.element.classList.contains("boolean-radio")) {
        this.yesRadio = await createDOMNodeReference(`#${this.element.id}_1`);
        this.noRadio = await createDOMNodeReference(`#${this.element.id}_0`);
      }

      this.element.addEventListener("change", () => {
        this.value = this.element.value;
      });

      // based on the type of element we have targeted in instantiation
      // we now grab the parent element that will be responsible for
      // 'showing' and 'hiding' the target element
      // this is needed also in order to observe changes to visibility so that
      // changes to target can cascade to dependent DOMNodeReferences
      switch (this.element.tagName) {
        case "SPAN":
        case "INPUT":
        case "TEXTAREA":
        case "SELECT":
          this.visibilityController = this.element.closest("td");
          break;
        case "FIELDSET":
        default:
          this.visibilityController = this.element;
      }

      this.defaultDisplay = this.visibilityController.style.display;

      this.isLoaded = true;
    } catch (e) {
      throw new Error(
        `powerpagestoolkit: There was an error initializing a DOMNodeReference with the target: ${this.target} :: ${e}`
      );
    }
  }

  /**
   * Hides the element by setting its display style to "none".
   * @method hide
   */
  /******/ hide() {
    this.visibilityController.style.display = "none";
  }

  /**
   * Shows the element by restoring its default display style.
   * @method show
   */
  /******/ show() {
    this.visibilityController.style.display = this.defaultDisplay;
  }

  /**
   * Sets the value of the HTML element.
   * @method setValue
   * @param {string} value - The value to set for the HTML element.
   */
  /******/ setValue(value) {
    this.element.value = value;
  }

  /**
   * Appends child elements to the HTML element.
   * @method append
   * @param {...HTMLElement} elements - The elements to append to the HTML element.
   */
  /******/ append(...elements) {
    this.element.append(...elements);
  }

  /**
   * Inserts elements after the HTML element.
   * @method after
   * @param {...HTMLElement} elements - The elements to insert after the HTML element.
   */
  /******/ after(...elements) {
    this.element.after(...elements);
  }

  /**
   * Retrieves the label associated with the HTML element.
   * @method getLabel
   * @returns {HTMLElement} The label element associated with this element.
   * @throws {Error} Throws an error if the label cannot be found.
   */
  /******/ getLabel() {
    return document.querySelector(`#${this.element.id}_label`) || null;
  }

  /**
   * Appends child elements to the label associated with the HTML element.
   * @method appendToLabel
   * @param {...HTMLElement} elements - The elements to append to the label.
   */
  /******/ appendToLabel(...elements) {
    const label = this.getLabel();
    if (label) {
      label.append(" ", ...elements);
    }
  }

  /**
   * Adds a click event listener to the HTML element.
   * @method addClickListener
   * @param {Function} eventHandler - The function to execute when the element is clicked.
   */
  /******/ addClickListener(eventHandler) {
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
  /******/ addChangeListener(eventHandler) {
    this.element.addEventListener("change", (e) => {
      e.preventDefault();
      eventHandler();
    });
  }

  /**
   * Unchecks both the yes and no radio buttons if they exist.
   * @method uncheckRadios
   */
  /******/ uncheckRadios() {
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
  /******/ createValidation(evaluationFunction, fieldDisplayName) {
    new FieldValidation(this.id, `'${fieldDisplayName}'`, evaluationFunction);
  }

  /**
   * Adds a tooltip with specified text to the label associated with the HTML element.
   * @method addLabelTooltip
   * @param {string} text - The text to display in the tooltip.
   */
  /******/ addLabelTooltip(text) {
    this.appendToLabel(createInfoEl(text));
  }

  /******/ addToolTip(text) {
    this.append(createInfoEl(text));
  }

  /**
   * Sets the inner HTML content of the HTML element.
   * @method setTextContent
   * @param {string} text - The text to set as the inner HTML of the element.
   */
  /******/ setTextContent(text) {
    this.element.innerHTML = text;
  }

  /**
   *
   * @param {boolean} shouldShow shows or hides the target
   * if = true => show, if = false => hide
   */
  toggleVisibility(shouldShow) {
    shouldShow ? this.show() : this.hide();
  }

  /**
   *
   * @param {Function} condition A Function that return a boolean value to set the
   *  visibility of the targeted element. if condition() returns true, element is shown.
   *  If false, element is hidden
   * @param {DOMNodeReference} triggerNode The DOMNodeReference to which an
   * event listener will be registered to change the visibility state of the calling
   * DOMNodeReference
   */
  /******/ configureConditionalRendering(condition, triggerNode) {
    this.toggleVisibility(condition());
    if (triggerNode) {
      triggerNode.addChangeListener(() => {
        this.toggleVisibility(condition());
      });

      const observer = new MutationObserver(() => {
        const display = window.getComputedStyle(
          triggerNode.visibilityController
        ).display;
        this.toggleVisibility(display !== "none" && condition());
      });

      observer.observe(triggerNode.visibilityController, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }
  }

  /**
   * Executes a callback function once the element is fully loaded.
   * If the element is already loaded, the callback is called immediately.
   * Otherwise, a MutationObserver is used to detect when the element is added to the DOM.
   * @method onceLoaded
   * @param {Function} callback - A callback function to execute once the element is loaded.
   */
  /******/ onceLoaded(callback) {
    if (this.isLoaded) {
      callback(this);
    } else {
      const observer = new MutationObserver(() => {
        if (document.querySelector(this.target)) {
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
 * @param {string | HTMLElement} target - The CSS selector for the desired DOM element.
 * @returns {Promise<DOMNodeReference>} A promise that resolves to a Proxy of the initialized DOMNodeReference instance.
 */
export async function createDOMNodeReference(target) {
  try {
    const instance = new DOMNodeReference(target);
    await instance.init();

    return new Proxy(instance, {
      get: (target, prop) => {
        // do not proxy the initialization method
        // init() is only needed in this factory function
        if (prop == "init") return undefined;

        // proxy the class to wrap all methods in the 'onceLoaded' method, to make sure the
        // element is always available before executing method
        const value = target[prop];
        if (typeof value === "function" && prop !== "onceLoaded") {
          return (...args) =>
            target.onceLoaded(() => value.apply(target, args));
        }
        return value;
      },
    });
  } catch (e) {
    console.error(`There was an error creating a DOMNodeReference: ${e}`);
    throw new Error(e);
  }
}

/**
 * Creates and initializes multiple DOMNodeReference instances.
 * @async
 * @function createMultipleDOMNodeReferences
 * @param {string} querySelector - The CSS selector for the desired DOM elements.
 * @returns {Promise<DOMNodeReference[]>} A promise that resolves to an array of Proxies of initialized DOMNodeReference instances.
 */
export async function createMultipleDOMNodeReferences(querySelector) {
  try {
    let elements = Array.from(document.querySelectorAll(querySelector));
    elements = await Promise.all(
      elements.map((element) => createDOMNodeReference(element))
    );

    elements.hideAll = () => elements.forEach((instance) => instance.hide());
    elements.showAll = () => elements.forEach((instance) => instance.show());

    return elements;
  } catch (e) {
    console.error(
      `There was an error creating multiple DOMNodeReferences: ${e}`
    );
    throw new Error(e);
  }
}
