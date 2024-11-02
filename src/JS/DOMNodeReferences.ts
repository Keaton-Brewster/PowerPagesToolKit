import waitFor from "./waitFor.ts";
import createInfoEl from "./createInfoElement.ts";
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
  /******/ /******/ constructor(target: HTMLElement | string) {
    this.target = target;
    this.isLoaded = false;
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
      if (this.element.classList.contains("boolean-radio")) {
        await this._attachRadioButtons();
      }

      this._initValueSync();
      this._attachVisibilityController();
      this.defaultDisplay = this.visibilityController.style.display;

      this.isLoaded = true;
    } catch (e) {
      throw new DOMNodeInitializationError(this, e);
    }
  }

  _initValueSync() {
    // Function to update this.value based on element type

    // Initial sync
    this.updateValue();

    // Event listeners for real-time changes based on element type
    const elementType = (this.element as HTMLInputElement).type;
    if (elementType === "checkbox" || elementType === "radio") {
      this.element.addEventListener("click", this.updateValue.bind(this));
    } else if (
      elementType === "select-one" ||
      elementType === "select-multiple"
    ) {
      this.element.addEventListener("change", this.updateValue.bind(this));
    } else {
      this.element.addEventListener("input", this.updateValue.bind(this));
    }
  }

  updateValue(): void {
    switch ((this.element as HTMLInputElement).type) {
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
        this.value = null;
        break;
    }

    if (this.element.classList.contains("boolean-radio")) {
      (this.yesRadio as DOMNodeReference).updateValue();
      (this.noRadio as DOMNodeReference).updateValue();
    }
  }

  _attachVisibilityController(): void {
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

  async _attachRadioButtons(): Promise<void> {
    this.yesRadio = await createDOMNodeReference(`#${this.element.id}_1`);
    this.noRadio = await createDOMNodeReference(`#${this.element.id}_0`);
  }

  on(eventType: string, eventHandler: (e: Event) => void) {
    this.element.addEventListener(eventType, eventHandler.bind(this));
  }

  hide() {
    this.visibilityController.style.display = "none";
  }

  show() {
    this.visibilityController.style.display = this.defaultDisplay;
  }

  toggleVisibility(shouldShow: Function | boolean) {
    if (shouldShow instanceof Function) {
      shouldShow() ? this.show() : this.hide();
    } else {
      shouldShow ? this.show() : this.hide();
    }
  }

  setValue(value: any) {
    if (this.element.classList.contains("boolean-radio")) {
      (
        (this.yesRadio as DOMNodeReference).element as HTMLInputElement
      ).checked = value;
      ((this.noRadio as DOMNodeReference).element as HTMLInputElement).checked =
        !value;
    } else {
      (this.element as HTMLInputElement).value = value;
    }
  }

  disable() {
    try {
      (this.element as HTMLInputElement).disabled = true;
    } catch (e) {
      throw new Error(
        `There was an error trying to disable the target: ${this.target}`
      );
    }
  }

  enable() {
    try {
      (this.element as HTMLInputElement).disabled = false;
    } catch (e) {
      throw new Error(
        `There was an error trying to disable the target: ${this.target}`
      );
    }
  }

  append(...elements: HTMLElement[]) {
    this.element.append(...elements);
  }

  after(...elements: HTMLElement[]) {
    this.element.after(...elements);
  }

  getLabel() {
    return document.querySelector(`#${this.element.id}_label`) || null;
  }

  appendToLabel(...elements: HTMLElement[]) {
    const label = this.getLabel();
    if (label) {
      label.append(" ", ...elements);
    }
  }

  addLabelTooltip(text: string) {
    this.appendToLabel(createInfoEl(text));
  }

  addToolTip(text: string) {
    this.append(createInfoEl(text));
  }

  setTextContent(text: string) {
    this.element.innerHTML = text;
  }

  uncheckRadios() {
    if (this.yesRadio && this.noRadio) {
      (this.yesRadio.element as HTMLInputElement).checked = false;
      (this.noRadio.element as HTMLInputElement).checked = false;
    } else {
      console.error(
        "[SYNACT] Attempted to uncheck radios for an element that has no radios"
      );
    }
  }

  configureConditionalRendering(
    condition: () => boolean,
    triggerNodes: DOMNodeReference[]
  ) {
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
    logic: {
      requirementLogic: (instance: DOMNodeReference) => boolean;
      validationLogic: () => boolean;
    },
    fieldDisplayName: string,
    dependencies: DOMNodeReference[]
  ) {
    if (typeof Page_Validators !== "undefined") {
      const newValidator = document.createElement("span");
      newValidator.style.display = "none";
      newValidator.id = `${this.element.id}Validator`;
      (newValidator as any).controltovalidate = this.element.id;
      (
        newValidator as any
      ).errormessage = `<a href='#${this.element.id}_label'>${fieldDisplayName} is a required field</a>`;
      (newValidator as any).evaluationfunction =
        logic.validationLogic.bind(this);
      //eslint-disable-next-line
      Page_Validators.push(newValidator);
    } else {
      throw new Error(
        "Attempted to add to Validator where Page_Validators do not exist"
      );
    }

    this.setRequiredLevel(logic.requirementLogic(this));

    if (!dependencies) return;
    dependencies = Array.isArray(dependencies) ? dependencies : [dependencies];
    dependencies.forEach((dep) => {
      dep.element.addEventListener("change", () =>
        this.setRequiredLevel(logic.requirementLogic(this))
      );
    });
  }

  setRequiredLevel(isRequired: Function | boolean) {
    if (isRequired instanceof Function) {
      isRequired()
        ? this.getLabel()?.classList.add("required-field")
        : this.getLabel()?.classList.remove("required-field");
      return;
    } else {
      isRequired
        ? this.getLabel()?.classList.add("required-field")
        : this.getLabel()?.classList.remove("required-field");
    }
  }

  onceLoaded(callback: (instance: DOMNodeReference) => void) {
    if (this.isLoaded) {
      callback(this);
      return 
    } 

      if (this.target instanceof HTMLElement) {
        callback(this)
        return 
      }
      const observer = new MutationObserver(() => {
         
        if (document.querySelector((this.target as string))) {
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

/**
 * Creates and initializes a DOMNodeReference instance.
 * @async
 * @function createDOMNodeReference
 * @param {string | HTMLElement} target - The CSS selector for the desired DOM element.
 * @returns {Promise<DOMNodeReference>} A promise that resolves to a Proxy of the initialized DOMNodeReference instance.
 */
export async function createDOMNodeReference(target: HTMLElement | string) {
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
        const value = target[prop as string];
        if (typeof value === "function" && prop !== "onceLoaded") {
          return (...args: any[]) =>
            target.onceLoaded(() => value.apply(target, args));
        }
        return value;
      },
    });
  } catch (e) {
    console.error(`There was an error creating a DOMNodeReference: ${e}`);
    throw new Error(e as string);
  }
}

/**
 * Creates and initializes multiple DOMNodeReference instances.
 * @async
 * @function createMultipleDOMNodeReferences
 * @param {string} querySelector - The CSS selector for the desired DOM elements.
 * @returns {Promise<DOMNodeReference[]>} A promise that resolves to an array of Proxies of initialized DOMNodeReference instances.
 */
export async function createMultipleDOMNodeReferences(querySelector: string) {
  try {
    let elements = Array.from(document.querySelectorAll(querySelector));
    elements = await Promise.all(
      elements.map((element) => createDOMNodeReference(element)
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
