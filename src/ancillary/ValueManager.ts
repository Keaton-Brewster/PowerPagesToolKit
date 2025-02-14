import type DOMNodeReference from "../core/DOMNodeReference.ts";

declare interface ValueManagerProps {
  element: HTMLElement;
  noRadio: DOMNodeReference;
  yesRadio: DOMNodeReference;
  isRadio: boolean;
}

export default class ValueManager {
  public value: any;
  private element: HTMLElement;
  private noRadio: DOMNodeReference | null = null;
  private yesRadio: DOMNodeReference | null = null;
  private isRadio: boolean = false;

  constructor(properties: ValueManagerProps) {
    this.element = properties.element;
    this.noRadio = properties.noRadio;
    this.yesRadio = properties.yesRadio;
    this.isRadio = properties.isRadio;
  }

  public setValue(value: any, inst: DOMNodeReference): void {
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
      this.radioParent?.updateValue();
    } else {
      (this.element as HTMLInputElement).value = validatedValue;
    }

    this.value = validatedValue;
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
}
