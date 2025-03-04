import InputMask from "./InputMask.ts";

type CountryCodeFormat = "+" | "()" | "00";

interface PhoneNumberMaskOptions {
  countryCode?: string; // The actual country code (e.g., "1" for US)
  countryCodeFormat?: CountryCodeFormat; // How to format the country code
  format: string; // Format for the main phone number (e.g., "(xxx) xxx-xxxx")
}

export default class PhoneNumberMask extends InputMask {
  public override input: HTMLInputElement;
  protected options: PhoneNumberMaskOptions;

  constructor(
    inputElement: HTMLInputElement,
    options: Partial<PhoneNumberMaskOptions> = {}
  ) {
    super();
    this.input = inputElement;
    this.options = {
      format: options.format || "(xxx) xxx-xxxx",
      countryCode: options.countryCode || "",
      countryCodeFormat: options.countryCodeFormat || "+",
    };

    this.onFocus = this.onFocus.bind(this);
    this.formatInput = this.formatInput.bind(this);
    this.onBlur = this.onBlur.bind(this);

    this.setupEventListeners();

    // Initial formatting
    setTimeout(() => {
      this.formatInput();
    }, 0);
  }

  protected override setupEventListeners(): void {
    // Add specific handlers for phone input if needed
    this.input.addEventListener("focus", this.onFocus);
    this.input.addEventListener("input", this.formatInput);
    this.input.addEventListener("blur", this.onBlur);
  }

  protected formatInput(): void {
    const value = this.input.value;

    // Store caret position
    const caretPosition = this.input.selectionStart || 0;
    const oldLength = value.length;

    // Allow only digits and extract them
    const digits = value.replace(/\D/g, "");

    // Format according to the specified format
    const formattedValue = this.formatPhoneNumber(digits);

    // Update the input value
    this.input.value = formattedValue;

    // Adjust caret position based on the change in length
    const newPosition = Math.min(
      caretPosition + (formattedValue.length - oldLength),
      formattedValue.length
    );
    this.input.setSelectionRange(newPosition, newPosition);
  }

  private formatPhoneNumber(digits: string): string {
    if (!digits) return "";

    let phoneDigits = digits;
    let countryCodeValue = "";

    // Extract country code digits if a country code is specified
    if (this.options.countryCode) {
      const countryCodeLength = this.options.countryCode.length;

      // If we have enough digits, use them for the country code
      if (digits.length > countryCodeLength) {
        countryCodeValue = digits.substring(0, countryCodeLength);
        phoneDigits = digits.substring(countryCodeLength);
      } else {
        // Not enough digits for both country code and phone, prioritize country code
        countryCodeValue = digits;
        phoneDigits = "";
      }
    }

    // Format country code according to the specified format
    let formattedCountryCode = "";
    if (countryCodeValue) {
      switch (this.options.countryCodeFormat) {
        case "+":
          formattedCountryCode = `+${countryCodeValue} `;
          break;
        case "()":
          formattedCountryCode = `(${countryCodeValue}) `;
          break;
        case "00":
          formattedCountryCode = `00${countryCodeValue} `;
          break;
        default:
          formattedCountryCode = `+${countryCodeValue} `;
      }
    }

    // Format the main phone number
    let result = this.options.format;
    let digitIndex = 0;

    // Replace each 'x' in the format with a digit from phoneDigits
    for (let i = 0; i < result.length && digitIndex < phoneDigits.length; i++) {
      if (result[i] === "x") {
        result =
          result.substring(0, i) +
          phoneDigits[digitIndex++] +
          result.substring(i + 1);
      }
    }

    // Remove any remaining 'x' placeholders
    result = result.replace(/x/g, "");

    // Trim any extra formatting at the end if not all digits are used
    const lastNonFormatChar = result.split("").findIndex((char, index) => {
      return (
        !/\d/.test(char) &&
        result.substring(index).indexOf("x") === -1 &&
        result.substring(index).replace(/[\s\-()]/g, "").length === 0
      );
    });

    if (lastNonFormatChar !== -1) {
      result = result.substring(0, lastNonFormatChar);
    }

    return formattedCountryCode + result;
  }

  protected override onFocus(): void {
    // Select all text on focus for easier editing
    setTimeout(() => this.input.select(), 0);
  }

  protected override onBlur(): void {
    // Ensure proper formatting when leaving the field
    this.formatInput();

    // If the value has too few digits, consider clearing or keeping minimal format
    const digits = this.getDigits();
    const minLength = this.options.countryCode
      ? 7 + this.options.countryCode.length
      : 7; // Minimum reasonable length

    if (digits.length < minLength) {
      // Either clear completely or maintain basic format based on UX preference
      // this.input.value = ""; // Option 1: Clear completely
      // Option 2: Keep partial format with what digits we have (default)
    }
  }

  // Get the raw digits
  public getDigits(): string {
    return this.input.value.replace(/\D/g, "");
  }

  // Get country code digits separately
  public getCountryCode(): string {
    if (!this.options.countryCode) return "";

    const digits = this.getDigits();
    const countryCodeLength = this.options.countryCode.length;

    return digits.length >= countryCodeLength
      ? digits.substring(0, countryCodeLength)
      : digits;
  }

  // Get phone number digits without country code
  public getPhoneDigits(): string {
    if (!this.options.countryCode) return this.getDigits();

    const digits = this.getDigits();
    const countryCodeLength = this.options.countryCode.length;

    return digits.length > countryCodeLength
      ? digits.substring(countryCodeLength)
      : "";
  }

  // Set a new phone number value (digits only)
  public override setValue(digits: string): void {
    // Ensure we only have digits
    const cleanDigits = digits.replace(/\D/g, "");
    this.input.value = this.formatPhoneNumber(cleanDigits);
  }

  // Check if the phone number has a valid length
  public isValid(): boolean {
    const phoneDigits = this.getPhoneDigits();
    const countryDigits = this.getCountryCode();

    // Check if country code is complete
    const isCountryCodeValid =
      !this.options.countryCode ||
      countryDigits.length === this.options.countryCode.length;

    // Most phone numbers have 10 digits, but this can be adjusted
    return isCountryCodeValid && phoneDigits.length >= 10;
  }

  public destroy(): void {
    this.input.removeEventListener("focus", this.onFocus);
    this.input.removeEventListener("input", this.formatInput);
    this.input.removeEventListener("blur", this.onBlur);
  }
}
