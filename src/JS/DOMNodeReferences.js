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
      const element = await waitFor(this.target);
      this.element = element;

      if (!this.element) {
        throw new DOMNodeNotFoundError(this);
      }

      this._initValueSync();
      this._attachVisibilityController();
      this.defaultDisplay = this.visibilityController.style.display;

      if (this.element.classList.contains("boolean-radio")) {
        this._attachRadioButtons();
      }

      this.isLoaded = true;
    } catch (e) {
      throw new DOMNodeInitializationError(this, e);
    }
  }

  _initValueSync() {
    // Function to update this.value based on element type
    const updateValue = () => {
      switch (this.element.type) {
        case "checkbox":
        case "radio":
          this.value = this.element.checked;
          break;
        case "select-multiple":
          this.value = Array.from(this.element.selectedOptions).map(
            (option) => option.value
          );
          break;
        case "file":
          this.value =
            this.element.files.length > 0
              ? Array.from(this.element.files)
              : null;
          break;
        case "number":
          this.value =
            this.element.value !== "" ? Number(this.element.value) : null;
          break;
        default:
          this.value = this.element.value || null;
          break;
      }
    };

    // Initial sync
    updateValue();

    // Event listeners for real-time changes based on element type
    const elementType = this.element.type;
    if (elementType === "checkbox" || elementType === "radio") {
      this.element.addEventListener("click", updateValue);
    } else if (
      elementType === "select-one" ||
      elementType === "select-multiple"
    ) {
      this.element.addEventListener("change", updateValue);
    } else {
      this.element.addEventListener("input", updateValue);
    }

    // Sync periodically using requestAnimationFrame to catch programmatic updates
    const syncPeriodically = () => {
      updateValue();
      requestAnimationFrame(syncPeriodically);
    };

    // Start periodic sync
    requestAnimationFrame(syncPeriodically);
  }

  _attachVisibilityController() {
    const parent = this.element.closest("td");
    if (!parent) {
      this.visibilityController = this.element;
      return;
    }
    this.visibilityController = [
      "SPAN",
      "INPUT",
      "TEXTAREA",
      "SELECT",
    ].includes(this.element.tagName)
      ? parent
      : this.element;
  }

  async _attachRadioButtons() {
    this.yesRadio = await createDOMNodeReference(`#${this.element.id}_1`);
    this.noRadio = await createDOMNodeReference(`#${this.element.id}_0`);
  }

  on(eventType, eventHandler) {
    this.element.addEventListener(eventType, function (e) {
      eventHandler(e);
    });
  }

  hide() {
    this.visibilityController.style.display = "none";
  }

  show() {
    this.visibilityController.style.display = this.defaultDisplay;
  }

  toggleVisibility(shouldShow) {
    shouldShow ? this.show() : this.hide();
  }

  setValue(value) {
    if (this.element.classList.contains("boolean-radio")) {
      this.yesRadio.element.checked = value;
      this.noRadio.element.checked = !value;
    } else {
      this.element.value = value;
    }
  }

  disable() {
    try {
      this.element.disabled = true;
    } catch (e) {
      throw new Error(
        `There was an error trying to disable the target: ${this.target}`
      );
    }
  }

  enable() {
    try {
      this.element.disabled = false;
    } catch (e) {
      throw new Error(
        `There was an error trying to disable the target: ${this.target}`
      );
    }
  }

  append(...elements) {
    this.element.append(...elements);
  }

  after(...elements) {
    this.element.after(...elements);
  }

  getLabel() {
    return document.querySelector(`#${this.element.id}_label`) || null;
  }

  appendToLabel(...elements) {
    const label = this.getLabel();
    if (label) {
      label.append(" ", ...elements);
    }
  }

  addLabelTooltip(text) {
    this.appendToLabel(createInfoEl(text));
  }

  addToolTip(text) {
    this.append(createInfoEl(text));
  }

  setTextContent(text) {
    this.element.innerHTML = text;
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
  }

  configureConditionalRendering(condition, triggerNodes) {
    try {
      this.toggleVisibility(condition());
      if (triggerNodes) {
        const nodes = Array.isArray(triggerNodes)
          ? triggerNodes
          : [triggerNodes];
        nodes.forEach((node) => {
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
      }
    } catch (e) {
      throw new ConditionalRenderingError(this, e);
    }
  }

  configureValidationAndRequirements(
    { requirementLogic, validationLogic },
    fieldDisplayName,
    dependencies = []
  ) {
    if (typeof Page_Validators !== "undefined") {
      const newValidator = document.createElement("span");
      newValidator.style.display = "none";
      newValidator.id = `${this.id}Validator`;
      newValidator.controltovalidate = this.id;
      newValidator.errormessage = `<a href='#${this.element.id}_label'>${fieldDisplayName} is a required field</a>`;
      newValidator.evaluationfunction = validationLogic.bind(this);
      //eslint-disable-next-line
      Page_Validators.push(newValidator);
    } else {
      throw new Error(
        "Attempted to add to Validator where Page_Validators do not exist"
      );
    }

    this.setRequiredLevel(requirementLogic(this));

    if (!dependencies) return;
    dependencies = Array.isArray(dependencies) ? dependencies : [dependencies];
    dependencies.forEach((dep) => {
      dep.element.addEventListener("change", () =>
        this.setRequiredLevel(requirementLogic(this))
      );
    });
  }

  setRequiredLevel(isRequired) {
    if (isRequired) {
      this.getLabel().classList.add("required-field");
    } else {
      this.getLabel().classList.remove("required-field");
    }
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
