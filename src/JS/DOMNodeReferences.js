import waitFor from "./waitFor.js";
import createInfoEl from "./createInfoElement.js";
import {
  DOMNodeInitializationError,
  DOMNodeNotFoundError,
  ConditionalRenderingError,
} from "./errors.js";
import "../CSS/style.css";

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

  async _init() {
    try {
      waitFor(this.target)
        .then(async (element) => {
          this.element = element;

          if (!this.element) {
            throw new DOMNodeNotFoundError(this);
          }
          if (this.element.classList.contains("boolean-radio")) {
            await this._attachRadioButtons();
          }

          this._initValueSync();
          this._attachVisibilityController();
          this.defaultDisplay =
            this.visibilityController.style.display || "inline-block";

          this.isLoaded = true;
        })
        .catch((err) => {
          console.error(err);
          this.element = null;
          this.isLoaded = true;
        });
    } catch (e) {
      throw new DOMNodeInitializationError(this, e);
    }
  }

  _initValueSync() {
    // Function to update this.value based on element type

    // Initial sync
    this.updateValue();

    this.element.addEventListener("click", this.updateValue.bind(this));
    this.element.addEventListener("change", this.updateValue.bind(this));
    this.element.addEventListener("input", this.updateValue.bind(this));
    document.addEventListener("click", this.updateValue.bind(this));
    document.addEventListener("touchstart", this.updateValue.bind(this));
  }

  updateValue() {
    switch (this.element.type) {
      case "checkbox":
      case "radio":
        this.value = this.element.checked;
        this.checked = this.element.checked;
        break;
      case "select-multiple":
        this.value = Array.from(this.element.selectedOptions).map(
          (option) => option.value
        );
        break;
      case "number":
        this.value =
          this.element.value !== "" ? Number(this.element.value) : null;
        break;
      default:
        this.value = this.element.value || null;
        this.checked = this.element.checked || null;
        break;
    }

    if (this.element.classList.contains("boolean-radio")) {
      this.yesRadio.updateValue();
      this.noRadio.updateValue();
    }
  }

  _attachVisibilityController() {
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

  async _attachRadioButtons() {
    this.yesRadio = await createDOMNodeReference(`#${this.element.id}_1`);
    this.noRadio = await createDOMNodeReference(`#${this.element.id}_0`);
  }

  on(eventType, eventHandler) {
    this.element.addEventListener(eventType, eventHandler.bind(this));
    return this;
  }

  hide() {
    this.visibilityController.style.display = "none";
    return this;
  }

  show() {
    this.visibilityController.style.display = this.defaultDisplay;
    return this;
  }

  toggleVisibility(shouldShow) {
    if (shouldShow instanceof Function) {
      shouldShow() ? this.show() : this.hide();
    } else {
      shouldShow ? this.show() : this.hide();
    }
    return this;
  }

  setValue(value) {
    // Check if 'value' is a function
    if (typeof value === "function") {
      // Call the function and use the returned value
      value = value();
    }

    if (this.element.classList.contains("boolean-radio")) {
      this.yesRadio.element.checked = value;
      this.noRadio.element.checked = !value;
      this.value = this.yesRadio.checked;
    } else {
      this.element.value = value;
      this.value = value;
    }
    return this;
  }

  disable() {
    try {
      this.element.disabled = true;
    } catch (e) {
      throw new Error(
        `There was an error trying to disable the target: ${this.target}`
      );
    }
    return this;
  }

  enable() {
    try {
      this.element.disabled = false;
    } catch (e) {
      throw new Error(
        `There was an error trying to disable the target: ${this.target}`
      );
    }
    return this;
  }

  prepend(...nodes) {
    nodes.forEach((node) => {
      if (node instanceof DOMNodeReference) {
        this.element.prepend(node.element);
      } else {
        this.element.prepend(node);
      }
    });
    return this;
  }

  append(...nodes) {
    nodes.forEach((node) => {
      if (node instanceof DOMNodeReference) {
        this.element.append(node.element);
      } else {
        this.element.append(node);
      }
    });
    return this;
  }

  before(...nodes) {
    nodes.forEach((node) => {
      if (node instanceof DOMNodeReference) {
        this.element.before(node.element);
      } else {
        this.element.before(node);
      }
    });
    return this;
  }

  after(...nodes) {
    nodes.forEach((node) => {
      if (node instanceof DOMNodeReference) {
        this.element.after(node.element);
      } else {
        this.element.after(node);
      }
    });
    return this;
  }

  getLabel() {
    return document.querySelector(`#${this.element.id}_label`) || null;
  }

  appendToLabel(...elements) {
    const label = this.getLabel();
    if (label) {
      label.append(" ", ...elements);
    }
    return this;
  }

  addLabelTooltip(text) {
    this.appendToLabel(createInfoEl(text));
    return this;
  }

  addTooltip(text) {
    this.append(createInfoEl(text));
    return this;
  }

  setInnerHTML(string) {
    this.element.innerHTML = string;
    return this;
  }

  remove() {
    this.element.remove();
    return this;
  }

  setStyle(options) {
    if (Object.prototype.toString.call(options) !== "[object Object]") {
      throw new Error(
        `powerpagestoolkit: 'DOMNodeReference.setStyle' required options to be in the form of an object. Argument passed was of type: ${typeof options}`
      );
    }
    Object.keys(options).forEach((key) => {
      this.element.style[key] = options[key];
    });
    return this;
  }

  uncheckRadios() {
    if (this.yesRadio && this.noRadio) {
      this.yesRadio.element.checked = false;
      this.noRadio.element.checked = false;
    } else {
      console.error(
        "[SYNACT] Attempted to uncheck radios for an element that has no radios"
      );
    }
    return this;
  }

  configureConditionalRendering(condition, triggerNodes) {
    try {
      this.toggleVisibility(condition(this));
      if (triggerNodes) {
        const nodes = Array.isArray(triggerNodes)
          ? triggerNodes
          : [triggerNodes];
        nodes.forEach((node) => {
          node.on("change", () => this.toggleVisibility(condition(this)));

          const observer = new MutationObserver(() => {
            const display = window.getComputedStyle(
              node.visibilityController
            ).display;
            this.toggleVisibility(display !== "none" && condition(this));
          });
          observer.observe(node.visibilityController, {
            attributes: true,
            attributeFilter: ["style"],
          });
        });
      }
    } catch (e) {
      throw new ConditionalRenderingError(this, e);
    }
    return this;
  }

  configureValidationAndRequirements(
    isRequired,
    isValid,
    fieldDisplayName,
    dependencies = []
  ) {
    if (typeof Page_Validators !== "undefined") {
      const newValidator = document.createElement("span");
      newValidator.style.display = "none";
      newValidator.id = `${this.id}Validator`;
      newValidator.controltovalidate = this.id;
      newValidator.errormessage = `<a href='#${this.element.id}_label'>${fieldDisplayName} is a required field</a>`;
      newValidator.evaluationfunction = isValid.bind(this);
      //eslint-disable-next-line
      Page_Validators.push(newValidator);
    } else {
      throw new Error(
        "Attempted to add to Validator where Page_Validators do not exist"
      );
    }

    this.setRequiredLevel(isRequired(this));

    if (!dependencies) return this;
    dependencies = Array.isArray(dependencies) ? dependencies : [dependencies];
    dependencies.forEach((dep) => {
      dep.element.addEventListener("change", () =>
        this.setRequiredLevel(isRequired(this))
      );
    });
    return this;
  }

  setRequiredLevel(isRequired) {
    if (isRequired) {
      this.getLabel().classList.add("required-field");
    } else {
      this.getLabel().classList.remove("required-field");
    }
    return this;
  }

  onceLoaded(callback) {
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
    await instance._init();

    return new Proxy(instance, {
      get: (target, prop) => {
        // do not proxy the initialization method
        // init() is only needed in this factory function
        if (prop.toString().startsWith("_")) return undefined;

        // proxy the class to wrap all methods in the 'onceLoaded' method, to make sure the
        // element is always available before executing method
        const value = target[prop];
        if (typeof value === "function" && prop !== "onceLoaded") {
          return (...args) => {
            target.onceLoaded(() => value.apply(target, args));
            return target;
          };
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
