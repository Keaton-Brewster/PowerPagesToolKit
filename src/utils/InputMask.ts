/********/ /********/ export default abstract class InputMask {
  abstract input: HTMLInputElement;

  constructor() {}

  protected abstract setupEventListeners(): void;

  protected abstract formatInput(): void;

  protected onFocus(): void {
    // Select all text on focus for easier editing
    setTimeout(() => this.input.select(), 0);
  }

  protected onBlur(): void {
    // Ensure proper formatting when leaving the field
    this.formatInput();
  }

  // Set a new numerical value
  public setValue(value: any): void {
    this.input.value = String(value);
  }

  // Destroy the mask and remove event listeners
  public abstract destroy(): void;
}
