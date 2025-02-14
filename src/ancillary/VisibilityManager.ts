export default class VisibilityManager {
  private declare visibilityController: HTMLElement | null;
  private declare defaultVisibility: string | null;

  constructor(target: HTMLElement) {
    // Set the default visibility controller to the element itself
    this.visibilityController = target;

    // If the element is a table, use its closest fieldset as the controller
    if (target.tagName === "TABLE") {
      const fieldset = target.closest("fieldset");
      if (fieldset) {
        this.visibilityController = fieldset;
      }
    }

    // For specific tag types, use the closest 'td' if available as the controller
    const tagsRequiringTdParent = [
      "SPAN",
      "INPUT",
      "TEXTAREA",
      "SELECT",
      "TABLE",
    ];
    if (tagsRequiringTdParent.includes(target.tagName)) {
      const tdParent = target.closest("td");
      if (tdParent) {
        this.visibilityController = tdParent;
      }
    }

    this.defaultVisibility = this.visibilityController.style.display;
  }

  public hide(): void {
    this.visibilityController!.style.display = "none";
  }

  public show(): void {
    this.visibilityController!.style.display = this.defaultVisibility!;
  }

  public toggleVisibility(shouldShow: boolean): void {
    shouldShow ? this.show() : this.hide();
  }

  public getVisibility(): true | false {
    return (
      window.getComputedStyle(this.visibilityController!).display !== "none" &&
      window.getComputedStyle(this.visibilityController!).visibility !==
        "hidden" &&
      this.visibilityController!.getBoundingClientRect().height > 0 &&
      this.visibilityController!.getBoundingClientRect().width > 0
    );
  }

  public destroy(): void {
    this.visibilityController = null;
    this.defaultVisibility = null;
  }
}
