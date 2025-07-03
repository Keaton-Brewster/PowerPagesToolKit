import { parse } from "node:path";
import PowerPagesElement from "../core/PowerPagesElement.ts";
import parseOptionSetJson from "../utils/parseOptionSetJSON.ts";
import type DOMNodeReference from "./DOMNodeReference.ts";
import Radio from "./Radio.ts";

export default class ValueManager {
  public value: any;
  public checked: true | false = false;
  public element: HTMLElement | null;
  private noRadio: Radio | undefined;
  private yesRadio: Radio | undefined;
  public radioParent?: DOMNodeReference | undefined;
  private isRadio: boolean = false;
  private radioType: RadioType | undefined;

  constructor(instance: DOMNodeReference) {
    if (instance instanceof PowerPagesElement) {
      this.noRadio = instance.noRadio;
      this.yesRadio = instance.yesRadio;
      this.radioParent = undefined;
    } else if (instance instanceof Radio) {
      this.isRadio = true;
      this.noRadio = undefined;
      this.yesRadio = undefined;
      this.radioParent = instance.radioParent;
      this.radioType = instance.radioType;
    }

    this.element = instance.element;
  }

  public setValue(value: any): void {
    const validatedValue = this._validateValue(value);

    if (this.yesRadio instanceof Radio && this.noRadio instanceof Radio) {
      if (typeof value === "string") {
        const lowercaseValue = value.toLowerCase();
        if (["true", "yes", "truthy"].includes(lowercaseValue)) {
          (this.yesRadio.element as HTMLInputElement).checked = Boolean(true);
          (this.noRadio.element as HTMLInputElement).checked = Boolean(false);
          this.value = true;
        } else if (["false", "no", "falsy"].includes(lowercaseValue)) {
          (this.yesRadio.element as HTMLInputElement).checked = Boolean(false);
          (this.noRadio.element as HTMLInputElement).checked = Boolean(true);
          this.value = false;
        }
      } else if (typeof value === "boolean") {
        (this.yesRadio.element as HTMLInputElement).checked = Boolean(value);
        (this.noRadio.element as HTMLInputElement).checked = Boolean(!value);
        this.value = value;
      }
      // (this.element as HTMLInputElement).checked = Boolean(value);
      // (this.element as HTMLInputElement).value = value;
    } else if (
      this.isRadio ||
      (this.element as HTMLInputElement).type === "radio"
    ) {
      (this.element as HTMLInputElement).checked = value;
      this.checked = value;
      this.value = value;
      this.radioParent?.updateValue();
    } else {
      (this.element as HTMLInputElement).value = validatedValue;
      this.value = validatedValue;
    }
  }

  public async updateValue(e?: Event): Promise<void> {
    if (e) {
      e.stopPropagation();
    }

    const elementValue = await this.getElementValue();
    this.value = elementValue.value;

    if (elementValue.checked !== undefined) {
      this.checked = elementValue.checked;
    }

    // need a way to make sure radios stay in sync with each-other. If yes is checked, no should be 'unchecked' and vise-versa
    if (
      this.radioParent instanceof PowerPagesElement &&
      e &&
      e.type !== "manual-radio-sync"
    ) {
      switch (this.radioType) {
        case "falsy":
          this.radioParent.yesRadio!.setValue(!elementValue);
          await this.radioParent.yesRadio!.updateValue(
            new Event("manual-radio-sync")
          );

          break;
        case "truthy":
          this.radioParent.noRadio!.setValue(!elementValue);
          await this.radioParent.noRadio!.updateValue(
            new Event("manual-radio-sync")
          );

          break;
      }

      this.radioParent.updateValue();
    }
  }

  /* Utility helpers */
  private containsMultiSelectClass(): boolean {
    return Array.from(this.element!.parentElement!.querySelectorAll("*")).some(
      (node) =>
        Array.from(node.classList).some((cls) =>
          cls.toLowerCase().includes("multiselect")
        )
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async getElementValue(): Promise<ElementValue> {
    const input = this.element as HTMLInputElement;
    const select = this.element as HTMLSelectElement;

    if (this.yesRadio instanceof Radio && this.noRadio instanceof Radio) {
      return {
        value: this.yesRadio.checked,
        checked: this.yesRadio.checked,
      };
    }

    // in the case that an element is a multi-select, we need to parse the option value differently.
    // need code that searches the parent element for any child element that contains a class name with 'multiselect', and if so, return a custom parse of the element value
    if (this.containsMultiSelectClass()) {
      // we have to timeout, because the PCF control that is used by the multiselect fields does not immediately update the value of the input element
      await this.delay(500);
      return {
        value: parseOptionSetJson(input.value),
      };
    }

    let returnValue: ElementValue = {
      value: null,
    };
    switch (input.type) {
      case "checkbox":
      case "radio":
        return {
          value: input.checked,
          checked: input.checked,
        };
      case "select-multiple":
        return {
          value: Array.from(select.selectedOptions).map(
            (option) => option.value
          ),
        };

      case "select-one":
        return {
          value: select.value,
        };

      case "number":
        return {
          value: input.value !== "" ? Number(input.value) : null,
        };

      // currency fields can sometimes create a headache when trying to send the values to the API endpoint, so performing extra validation on those cases here
      default: {
        let cleanValue: string | number = input.value;
        if (this.element!.classList.contains("decimal")) {
          cleanValue = parseFloat(input.value.replace(/[$,]/g, "").trim());
        }

        returnValue = {
          value: cleanValue,
        };
      }
    }

    returnValue = {
      ...returnValue,
      value: this._validateValue(returnValue.value),
    };

    return returnValue;
  }

  protected _validateValue(value: any): any {
    if (typeof value === "boolean" || value === "true" || value === "false") {
      return value === true || value === "true";
    }

    // If it's a select element or text input (not decimal), return as is
    if (
      this.element instanceof HTMLSelectElement ||
      ((this.element as HTMLInputElement).type === "text" &&
        !(this.element as HTMLInputElement).classList.contains("decimal"))
    ) {
      return value;
    }

    // Handle null/empty cases
    if (value === null || value === "") {
      return value;
    }

    if (!isNaN(Number(value))) {
      return Number(value);
    }

    return value;
  }

  public clearValue(): void {
    // This method does not work as intended, and leads to bugs wherein if a user updates a field AFTER clearValue has been called, the value is not being tracked in Microsoft's form value management

    try {
      const element = this.element;
      if (element instanceof HTMLInputElement) {
        switch (element.type.toLowerCase()) {
          case "checkbox":
          case "radio":
            element.checked = false;
            this.checked = false;
            this.value = false;
            break;

          case "number":
            element.value = "";
            this.value = null;
            break;

          default: // handles text, email, tel, etc.
            element.value = "";
            this.value = null;
            break;
        }
      } else if (element instanceof HTMLSelectElement) {
        if (element.multiple) {
          Array.from(element.options).forEach(
            (option) => (option.selected = false)
          );
          this.value = null;
        } else {
          element.selectedIndex = -1;
          this.value = null;
        }
      } else if (element instanceof HTMLTextAreaElement) {
        element.value = "";
        this.value = null;
      } else {
        this.value = null;
      }
    } catch (error) {
      const errorMessage = `Failed to clear values for element with target "${this}": ${
        error instanceof Error ? error.message : String(error)
      }`;
      throw new Error(errorMessage);
    }
  }

  public destroy(): void {
    this.value = null;
    this.checked = false;
    this.element = null;
    this.noRadio = undefined;
    this.yesRadio = undefined;
    this.isRadio = false;
  }
}
