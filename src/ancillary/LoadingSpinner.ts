/**
 * @class LoadingSpinner - instantiate a spinner to handle loading state in your powerpages site
 */
/********/ /********/ export default class LoadingSpinner extends HTMLElement {
  private element!: HTMLDivElement;

  constructor() {
    if (!document) {
      throw new Error(`Cannot instantiate 'LoadingSpinner': No DOM Found`);
    }
    super();

    this.id = "loader";
    this.classList.add("loader-overlay", "hidden");

    this.element = document.createElement("div");
    this.element.classList.add("spinner-border", "text-light");
    this.element.role = "status";
    this.appendChild(this.element);

    const span: HTMLSpanElement = document.createElement("span");
    span.classList.add("visually-hidden");
    span.textContent = "Loading...";
    this.element.appendChild(span);

    // finally add this to the DOM
    document.body.appendChild(this);
  }

  /**
   * @method hide - Hides the loading spinner
   */
  public hide(): void {
    this.classList.add("hidden");
  }

  /**
   * @method show - Shows the loading spinner
   */
  public show(): void {
    this.classList.remove("hidden");
  }
}

const uid: string = `loading-${crypto.randomUUID()}`;
customElements.define(uid, LoadingSpinner);
