import InputMask from "./InputMask.ts";

interface MoneyInputMaskOptions extends InputMaskOptions {
  prefix: CurrencySymbol; // Currency symbol (e.g., "$")
  decimalPlaces: number; // Number of decimal places (default: 2)
  thousandsSeparator: string; // Character for separating thousands (e.g., ",")
  decimalSeparator: string; // Character for decimal point (e.g., ".")
  allowNegative: boolean; // Whether to allow negative values
}

export default class MoneyMask extends InputMask {
  public input: HTMLInputElement;
  protected options: MoneyInputMaskOptions;
  private buffer: string = "";
  private charAtSelection: string | undefined = "";
  private charBeforeSelection: string | undefined = "";
  private lengthOf0FormattedValue: number;
  // Cache regex patterns
  private readonly digitRegex = /\d/;
  private readonly nonDigitRegex = /\D/g;
  private readonly thousandsRegex = /\B(?=(\d{3})+(?!\d))/g;
  private readonly separatorRegex: RegExp;

  constructor(
    inputElement: HTMLInputElement,
    options: Partial<MoneyInputMaskOptions> = {}
  ) {
    super();
    this.input = inputElement;
    this.options = {
      prefix: options.prefix || "$",
      decimalPlaces: options.decimalPlaces ?? 2,
      thousandsSeparator: options.thousandsSeparator || ",",
      decimalSeparator: options.decimalSeparator || ".",
      allowNegative: options.allowNegative ?? true,
    };

    // Create escaped separator regex once during initialization
    const escapedThousands = this.escapeRegExp(this.options.thousandsSeparator);
    const escapedDecimal = this.escapeRegExp(this.options.decimalSeparator);
    this.separatorRegex = new RegExp(`[${escapedThousands}${escapedDecimal}]`);

    // Bind methods once
    this.onFocus = this.onFocus.bind(this);
    this.onInput = this.onInput.bind(this);
    this.onSelectionChange = this.onSelectionChange.bind(this);
    this.onBlur = this.onBlur.bind(this);

    // Calculate zero value length once
    this.lengthOf0FormattedValue = `0${
      this.options.decimalPlaces > 0
        ? this.options.decimalSeparator + "0".repeat(this.options.decimalPlaces)
        : ""
    }`.length;

    this.setupEventListeners();

    // Initialize with existing value if present
    if (this.input.value) {
      this.buffer = this.input.value.replace(this.nonDigitRegex, "");
    }

    // Initial formatting
    this.formatAndDisplay();
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private formatAndDisplay(): void {
    const numericValue = Number(this.buffer || "0");
    this.input.value = this.formatNumber(numericValue);
  }

  protected override setupEventListeners(): void {
    this.input.addEventListener("focus", this.onFocus);
    this.input.addEventListener("input", this.onInput);
    this.input.addEventListener("selectionchange", this.onSelectionChange);
    this.input.addEventListener("blur", this.onBlur);
  }

  protected formatInput(): void {
    const value = this.input.value;
    const caretPosition = this.input.selectionStart || 0;
    const oldLength = value.length;

    // Create allowed characters pattern only when needed
    const allowedPattern = new RegExp(
      `[^0-9${this.options.decimalSeparator}${
        this.options.allowNegative ? "-" : ""
      }]`,
      "g"
    );

    let cleanValue = value.replace(allowedPattern, "");

    // Ensure only one decimal separator
    const parts = cleanValue.split(this.options.decimalSeparator);
    if (parts.length > 2) {
      cleanValue =
        parts[0] + this.options.decimalSeparator + parts.slice(1).join("");
    }

    // Handle negative sign
    if (this.options.allowNegative && cleanValue.indexOf("-") > 0) {
      cleanValue = cleanValue.replace(/-/g, "");
      if (cleanValue.charAt(0) !== "-") {
        cleanValue = "-" + cleanValue;
      }
    }

    // Convert to number and format
    let numericValue: number;
    if (cleanValue === "" || cleanValue === "-") {
      numericValue = 0;
    } else {
      numericValue = parseFloat(
        cleanValue.replace(this.options.decimalSeparator, ".")
      );
    }

    if (isNaN(numericValue)) {
      numericValue = 0;
    }

    // Format the number
    const formattedValue = this.formatNumber(numericValue);

    // Update the input value
    this.input.value = formattedValue;

    // Adjust caret position
    const newPosition = caretPosition + (formattedValue.length - oldLength);
    this.input.setSelectionRange(newPosition, newPosition);
  }

  protected formatNumber(value: number): string {
    const adjustedValue = value / 10 ** this.options.decimalPlaces;
    const isNegative = adjustedValue < 0;
    const absoluteValue = Math.abs(adjustedValue);

    // Format with fixed decimal places
    const formatted = absoluteValue.toFixed(this.options.decimalPlaces);
    const [integerPart, decimalPart] = formatted.split(".");

    // Add thousands separators
    const formattedInteger = integerPart.replace(
      this.thousandsRegex,
      this.options.thousandsSeparator
    );

    // Combine parts
    return (
      (isNegative ? "-" : "") +
      this.options.prefix +
      formattedInteger +
      (this.options.decimalPlaces > 0
        ? this.options.decimalSeparator + decimalPart
        : "")
    );
  }

  protected onSelectionChange(_e: Event): void {
    const position = this.input.selectionStart as number;
    this.charAtSelection = this.input.value[position];
    this.charBeforeSelection = this.input.value[position - 1];
  }

  protected onInput(_e: Event): void {
    const e = _e as InputEvent;
    const formattedValue: string = this.input.value;
    const caretPosition: number = this.input.selectionStart ?? 0;

    // Calculate the raw index: count only digits before the caret
    const rawIndex = formattedValue
      .slice(0, caretPosition)
      .replace(this.nonDigitRegex, "").length;

    let newRawIndex = rawIndex;

    switch (e.inputType) {
      case "insertText":
        // Handle text insertion
        this.buffer =
          this.buffer.slice(0, rawIndex - 1) +
          (e.data || "").replace(this.nonDigitRegex, "") +
          this.buffer.slice(rawIndex - 1);

        newRawIndex = rawIndex;
        break;

      case "deleteContentBackward":
        // Handle backspace
        if (rawIndex >= 0) {
          if (this.separatorRegex.test(this.charBeforeSelection as string)) {
            this.buffer =
              this.buffer.slice(0, rawIndex - 1) + this.buffer.slice(rawIndex);
            newRawIndex = rawIndex - 1;
          } else {
            this.buffer =
              this.buffer.slice(0, rawIndex) + this.buffer.slice(rawIndex + 1);
            newRawIndex = rawIndex;
          }
        } else if (formattedValue === "") {
          this.buffer = "";
        }
        break;

      case "deleteContentForward":
        // Handle delete key
        if (rawIndex < this.buffer.length) {
          this.buffer =
            this.buffer.slice(0, rawIndex) + this.buffer.slice(rawIndex + 1);
        }
        break;

      case "deleteWordBackward":
      case "deleteWordForward":
        // Handle word deletion
        this.buffer = "";
        newRawIndex = this.lengthOf0FormattedValue;
        break;

      default:
        // Fallback for other input types
        this.buffer = formattedValue.replace(this.nonDigitRegex, "");
        newRawIndex = this.buffer.length;
    }

    // Format and update the display
    const numericValue = Number(this.buffer || "0");
    const newFormattedValue = this.formatNumber(numericValue);
    this.input.value = newFormattedValue;

    // Update caret position
    const newCaretPosition = this.mapRawIndexToFormattedPosition(
      newRawIndex,
      newFormattedValue
    );

    this.input.setSelectionRange(newCaretPosition, newCaretPosition);
  }

  private mapRawIndexToFormattedPosition(
    rawIndex: number,
    formatted: string
  ): number {
    let digitCount = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (this.digitRegex.test(formatted[i])) {
        digitCount++;
      }
      if (digitCount === rawIndex) {
        return i + 1;
      }
    }
    return formatted.length;
  }

  protected override onFocus(): void {
    // Debounce selection to avoid race conditions
    setTimeout(() => this.input.select(), 0);
  }

  protected override onBlur(): void {
    // Format on blur
    const numericValue = Number(this.buffer || "0");
    this.input.value = this.formatNumber(numericValue);

    // Reset to zero if needed
    if (numericValue === 0) {
      this.buffer = "";
      const zeros = "0".repeat(this.options.decimalPlaces);
      this.input.value = `${this.options.prefix}0${
        this.options.decimalPlaces > 0
          ? this.options.decimalSeparator + zeros
          : ""
      }`;
    }
  }

  // Get the numerical value
  public getNumericalValue(): number {
    return Number(this.buffer || "0") / 10 ** this.options.decimalPlaces;
  }

  // Set a new numerical value
  public override setValue(value: number): void {
    const scaledValue = Math.round(
      Math.abs(value) * 10 ** this.options.decimalPlaces
    );

    this.buffer = scaledValue.toString();
    this.input.value = this.formatNumber(scaledValue);
  }

  public override destroy(): void {
    this.input.removeEventListener("focus", this.onFocus);
    this.input.removeEventListener("input", this.onInput);
    this.input.removeEventListener("selectionchange", this.onSelectionChange);
    this.input.removeEventListener("blur", this.onBlur);
  }
}
