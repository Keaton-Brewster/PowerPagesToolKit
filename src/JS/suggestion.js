import waitFor from "./waitFor.js";
import FieldValidation from "./FieldValidation.class.js";
import createInfoEl from "./createInfoElement.js";

class DOMNodeReference {
  constructor(target) {
    this.target = target;
    this.element = null;
    this.isLoaded = false;
    this.visibilityController = null;
    this.defaultDisplay = "";
    this.value = null;
  }

  async init() {
    try {
      this.element = await waitFor(this.target);

      if (!this.element) {
        throw new Error(
          `[SYNACT] No element found for selector: ${this.target}`
        );
      }

      this.value = this.element.value;
      this.setupRadioButtons();
      this.setupValueListener();
      this.visibilityController = this.getVisibilityController();
      this.defaultDisplay = this.visibilityController.style.display;
      this.isLoaded = true;
    } catch (e) {
      console.error(`Initialization error for target ${this.target}: ${e}`);
      throw new Error(e);
    }
  }

  setupRadioButtons() {
    if (this.element.classList.contains("boolean-radio")) {
      this.yesRadio = createDOMNodeReference(`#${this.element.id}_1`);
      this.noRadio = createDOMNodeReference(`#${this.element.id}_0`);

      this.yesRadio.element.addEventListener("click", () => {
        this.value = "checked";
      });
      this.noRadio.element.addEventListener("click", () => {
        this.value = "unchecked";
      });
    }
  }

  setupValueListener() {
    this.element.addEventListener("change", () => {
      this.value = this.element.value;
    });
  }

  getVisibilityController() {
    const parent = this.element.closest("td");
    return ["SPAN", "INPUT", "TEXTAREA", "SELECT"].includes(
      this.element.tagName
    )
      ? parent || this.element
      : this.element;
  }

  hide() {
    if (this.visibilityController) {
      this.visibilityController.style.display = "none";
    }
  }

  show() {
    if (this.visibilityController) {
      this.visibilityController.style.display = this.defaultDisplay;
    }
  }

  setValue(value) {
    this.element.value = value;
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

  addClickListener(eventHandler) {
    this.element.addEventListener("click", (e) => {
      e.preventDefault();
      eventHandler();
    });
  }

  addChangeListener(eventHandler) {
    this.element.addEventListener("change", (e) => {
      e.preventDefault();
      eventHandler();
    });
  }

  uncheckRadios() {
    if (this.yesRadio && this.noRadio) {
      this.yesRadio.element.checked = false;
      this.noRadio.element.checked = false;
    } else {
      console.warn("[SYNACT] Attempted to uncheck radios, but none exist");
    }
  }

  createValidation(evaluationFunction, fieldDisplayName) {
    new FieldValidation(this.id, `'${fieldDisplayName}'`, evaluationFunction);
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

  configureConditionalRendering(condition, triggerNode = null) {
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
    } else {
      this.toggleVisibility(condition());
    }
  }

  toggleVisibility(shouldShow) {
    shouldShow ? this.show() : this.hide();
  }

  onceLoaded(callback) {
    if (this.isLoaded) {
      callback(this);
    } else {
      const observer = new MutationObserver(() => {
        if (document.querySelector(this.target)) {
          observer.disconnect();
          this.isLoaded = true;
          callback(this);
        }
      });

      observer.observe(document.body, {
        subtree: true,
        childList: true,
      });
    }
  }
}

export async function createDOMNodeReference(target) {
  const instance = new DOMNodeReference(target);
  await instance.init();

  return new Proxy(instance, {
    get(target, prop) {
      if (prop === "init") return undefined;
      const value = target[prop];
      return typeof value === "function" && prop !== "onceLoaded"
        ? (...args) => target.onceLoaded(() => value.apply(target, args))
        : value;
    },
  });
}

export async function createMultipleDOMNodeReferences(querySelector) {
  const elements = await Promise.all(
    Array.from(document.querySelectorAll(querySelector)).map(
      createDOMNodeReference
    )
  );

  elements.hideAll = () => elements.forEach((instance) => instance.hide());
  elements.showAll = () => elements.forEach((instance) => instance.show());

  return elements;
}
