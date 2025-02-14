import DOMNodeReference from "../core/DOMNodeReference.ts";

declare interface ValueManagerProps {
  element: HTMLElement;
  noRadio?: DOMNodeReference;
  yesRadio?: DOMNodeReference;
  isRadio: boolean;
}

export default class ValueManager {
  public value: any;
  public checked: true | false | undefined = false;
  private element: HTMLElement | null;
  private noRadio?: DOMNodeReference | undefined;
  private yesRadio?: DOMNodeReference | undefined;
  private isRadio: boolean = false;

  constructor(properties: ValueManagerProps) {
    this.element = properties.element;
    this.noRadio = properties.noRadio;
    this.yesRadio = properties.yesRadio;
    this.isRadio = properties.isRadio;
  }

  public setValue(value: any): void {
    const validatedValue = this._validateValue(value);

    if (
      this.yesRadio instanceof DOMNodeReference &&
      this.noRadio instanceof DOMNodeReference
    ) {
      (this.yesRadio.element as HTMLInputElement).checked = Boolean(value);
      (this.noRadio.element as HTMLInputElement).checked = Boolean(!value);
      this.value = value;
      (this.element as HTMLInputElement).checked = Boolean(value);
      (this.element as HTMLInputElement).value = value;
    } else if (
      this.isRadio ||
      (this.element as HTMLInputElement).type === "radio"
    ) {
      (this.element as HTMLInputElement).checked = value;
      // this.radioParent?.updateValue();
    } else {
      (this.element as HTMLInputElement).value = validatedValue;
    }

    this.value = validatedValue;
  }

  public async updateValue(e?: Event): Promise<void> {
    if (e) {
      e.stopPropagation();
    }

    if (
      this.yesRadio instanceof DOMNodeReference &&
      this.noRadio instanceof DOMNodeReference
    ) {
      this.yesRadio!.updateValue();
      this.noRadio!.updateValue();
    }

    const elementValue = await this.getElementValue();
    this.value = elementValue.value;

    if (elementValue.checked !== undefined) {
      this.checked = elementValue.checked;
    }
  }

  public getElementValue(): Promise<ElementValue> {
    return new Promise((resolve) => {
      const input = this.element as HTMLInputElement;
      const select = this.element as HTMLSelectElement;

      if (
        this.yesRadio instanceof DOMNodeReference &&
        this.noRadio instanceof DOMNodeReference
      ) {
        resolve({
          value: this.yesRadio.checked,
          checked: this.yesRadio.checked,
        });
      }

      let returnValue: ElementValue = {
        value: null,
      };
      switch (input.type) {
        case "checkbox":
        case "radio":
          resolve({
            value: input.checked,
            checked: input.checked,
          });
          break;
        case "select-multiple":
          resolve({
            value: Array.from(select.selectedOptions).map(
              (option) => option.value
            ),
          });
          break;

        case "select-one":
          resolve({
            value: select.value,
          });
          break;

        case "number":
          resolve({
            value: input.value !== "" ? Number(input.value) : null,
          });
          break;

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

      resolve(returnValue);
    });
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

  public clearValue(): void {}

  public destroy(): void {
    this.value = null;
    this.checked = undefined;
    this.element = null;
    this.noRadio = undefined;
    this.yesRadio = undefined;
    this.isRadio = false;
  }
}
