import InputMask from "./InputMask.ts";

interface MoneyInputMaskOptions extends InputMaskOptions {
  prefix: CurrencySymbol; // Currency symbol (e.g., "$")
  decimalPlaces: number; // Number of decimal places (default: 2)
  thousandsSeparator: string; // Character for separating thousands (e.g., ",")
  decimalSeparator: string; // Character for decimal point (e.g., ".")
  allowNegative: boolean; // Whether to allow negative values
}

/********/ /********/ export default class MoneyMask extends InputMask {
  public input: HTMLInputElement;
  protected options: MoneyInputMaskOptions;
  private buffer: string = "";
  private charAtSelection: string | undefined = "";
  private charBeforeSelection: string | undefined = "";

  /********/ constructor(
    inputElement: HTMLInputElement,
    options: Partial<MoneyInputMaskOptions> = {}
  ) {
    super();
    this.input = inputElement;
    this.options = {
      prefix: options.prefix || "$",
      decimalPlaces:
        options.decimalPlaces !== undefined ? options.decimalPlaces : 2,
      thousandsSeparator: options.thousandsSeparator || ",",
      decimalSeparator: options.decimalSeparator || ".",
      allowNegative:
        options.allowNegative !== undefined ? options.allowNegative : true,
    };

    this.onFocus = this.onFocus.bind(this);
    this.formatInput = this.formatInput.bind(this);
    this.onInput = this.onInput.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onSelectionChange = this.onSelectionChange.bind(this);

    this.setupEventListeners();

    if (this.input.value) {
      // Remove all non-digit characters.
      // For example, if input.value is "$1,234.56", this yields "123456"
      this.buffer = this.input.value.replace(/\D/g, "");
    }

    // Initial formatting using the buffer.
    setTimeout(() => {
      // Convert the buffer to a number (default to 0 if buffer is empty)
      const numericValue = Number(this.buffer || "0");
      this.input.value = this.formatNumber(numericValue);
    }, 0);
  }

  protected override setupEventListeners(): void {
    // Add specific handlers for phone input if needed
    this.input.addEventListener("focus", this.onFocus);
    this.input.addEventListener("input", this.onInput);
    this.input.addEventListener("selectionchange", this.onSelectionChange);
    this.input.addEventListener("blur", this.onBlur);
  }

  protected formatInput(): void {
    const value = this.input.value;

    // Store caret position
    const caretPosition = this.input.selectionStart || 0;
    const oldLength = value.length;

    // Allow only digits, decimal separator, negative sign, and handle backspace
    let cleanValue = value.replace(
      new RegExp(
        `[^0-9${this.options.decimalSeparator}${
          this.options.allowNegative ? "-" : ""
        }]`,
        "g"
      ),
      ""
    );

    // Ensure only one decimal separator
    const parts = cleanValue.split(this.options.decimalSeparator);
    if (parts.length > 2) {
      cleanValue =
        parts[0] + this.options.decimalSeparator + parts.slice(1).join("");
    }

    // Handle negative sign (only at the beginning)
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
      // Convert to number using the correct decimal separator
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

    // Adjust caret position based on the change in length
    const newPosition = caretPosition + (formattedValue.length - oldLength);
    this.input.setSelectionRange(newPosition, newPosition);
  }

  protected formatNumber(value: number): string {
    const adjustedValue = value / 10 ** this.options.decimalPlaces;
    // Handle negative sign
    const isNegative = value < 0;
    const absoluteValue = Math.abs(adjustedValue);

    // Format with fixed decimal places
    const formatted = absoluteValue.toFixed(this.options.decimalPlaces);
    // Split into integer and decimal parts
    const [initialIntegerPart, decimalPart] = formatted.split(".");

    // Add thousands separators
    const integerPart = initialIntegerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      this.options.thousandsSeparator
    );

    // Combine parts with the decimal separator and prefix
    const result =
      (isNegative ? "-" : "") +
      this.options.prefix +
      integerPart +
      (this.options.decimalPlaces > 0
        ? this.options.decimalSeparator + decimalPart
        : "");
    return result;
  }

  protected onSelectionChange(_e: Event): void {
    this.charAtSelection =
      this.input.value[this.input.selectionStart as number];

    this.charBeforeSelection =
      this.input.value[(this.input.selectionStart as number) - 1];
  }

  protected onInput(e: Event): void {
    const inputEvent = e as InputEvent;
    const formattedValue: string = this.input.value;
    // Get the current caret position from the formatted string.
    const caretPosition: number = this.input.selectionStart ?? 0;

    // Calculate the raw index: count only digits before the caret.
    const rawIndex = formattedValue
      .slice(0, caretPosition)
      .replace(/\D/g, "").length;
    let newRawIndex = rawIndex;

    // Determine what changed using inputType.
    if (inputEvent.inputType === "insertText") {
      // When text is inserted, inputEvent.data holds the inserted characters.
      // (If multiple characters are inserted at once, you may need to adjust.)
      const inserted = inputEvent.data || "";
      // Only allow digits.
      const insertedDigits = inserted.replace(/\D/g, "");
      // Update the buffer: insert the new digits at the raw index.
      this.buffer =
        this.buffer.slice(0, rawIndex - 1) +
        insertedDigits +
        this.buffer.slice(rawIndex - 1);
      newRawIndex = rawIndex;
    } else if (inputEvent.inputType === "deleteContentBackward") {
      // On backspace, remove one digit immediately before the raw index.
      if (rawIndex >= 0) {
        // if the carat is right after a , or . we want to delete the number BEFORE that character, and so have to do some extra checking before slicing the buffer. We do this by constructing a regular expression that has our escaped thousands separator and decimal separator.
        const regex = new RegExp(
          `[${this.options.thousandsSeparator.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}${this.options.decimalSeparator.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}]`
        );
        // Then we can use that custom regex to actually check if the character before the carat is one of the separators
        if (regex.test(this.charBeforeSelection as string)) {
          this.buffer =
            this.buffer.slice(0, rawIndex - 1) + this.buffer.slice(rawIndex);
          newRawIndex = rawIndex - 1;
        } else {
          this.buffer =
            this.buffer.slice(0, rawIndex) + this.buffer.slice(rawIndex + 1);
          newRawIndex = rawIndex;
        }
      } else if (formattedValue == "") {
        this.buffer = "";
      }
    } else if (inputEvent.inputType === "deleteContentForward") {
      // Optionally handle forward deletion if needed.
      if (rawIndex < this.buffer.length) {
        this.buffer =
          this.buffer.slice(0, rawIndex) + this.buffer.slice(rawIndex + 1);
        // newRawIndex remains the same.
      }
    } else if (
      ["deleteWordBackward", "deleteWordForward"].includes(inputEvent.inputType)
    ) {
      this.buffer = "";
      let decimals = "";
      for (let i = 0; i < this.options.decimalPlaces; ++i) {
        decimals += "0";
      }
      newRawIndex = `0.${decimals}`.length; // position at end
    } else {
      // For other inputTypes (like "deleteByCut" etc.), you might need to implement a diff
      // algorithm comparing this.previousValue and formattedValue.
      // For now, we'll simply update the buffer by stripping non-digits from the new value.
      this.buffer = formattedValue.replace(/\D/g, "");
      newRawIndex = this.buffer.length; // position at end
    }

    // Convert the updated buffer to a number (or 0 if empty).
    const numericValue = Number(this.buffer || "0");
    // Format the number using your formatting logic.
    const newFormattedValue = this.formatNumber(numericValue);
    this.input.value = newFormattedValue;

    // Map the new raw index to the caret position in the new formatted string.
    const newCaretPosition = this.mapRawIndexToFormattedPosition(
      newRawIndex,
      newFormattedValue
    );

    this.input.setSelectionRange(newCaretPosition, newCaretPosition);
  }

  /**
   * Given a raw digit index (from the buffer) and a formatted string,
   * returns the caret position in that formatted string.
   */
  private mapRawIndexToFormattedPosition(
    rawIndex: number,
    formatted: string
  ): number {
    let digitCount = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        digitCount++;
      }
      // Once we've encountered rawIndex digits, return the position right after.
      if (digitCount === rawIndex) {
        return i + 1;
      }
    }
    // If not enough digits, position at the end.
    return formatted.length;
  }

  protected override onFocus(): void {
    // Select all text on focus for easier editing
    setTimeout(() => this.input.select(), 0);
  }

  protected override onBlur(): void {
    // Ensure the latest formatting from the buffer is applied
    const numericValue = Number(this.buffer || "0");
    this.input.value = this.formatNumber(numericValue);

    // Optionally, if the value is zero, you might reset the buffer to an empty string:
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
    // Convert the buffer to a number, then inject the decimal
    return Number(this.buffer || "0") / 10 ** this.options.decimalPlaces;
  }

  // Set a new numerical value
  public override setValue(value: number): void {
    // Scale the number up to an integer representation
    const scaledValue = Math.round(
      Math.abs(value) * 10 ** this.options.decimalPlaces
    );

    // Update the buffer with the digits (as a string)
    // Optionally, store the negative sign in a separate flag or include it in the buffer if you handle it later
    this.buffer = scaledValue.toString();

    // Now update the input display
    this.input.value = this.formatNumber(scaledValue);
  }

  public override destroy(): void {
    this.input.removeEventListener("focus", this.onFocus);
    this.input.removeEventListener("input", this.formatInput);
    this.input.removeEventListener("blur", this.onBlur);
  }
}
