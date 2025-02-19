import DOMNodeReference from "../ancillary/DOMNodeReference.ts";
import VisibilityManager from "../ancillary/VisibilityManager.ts";
import EventManager from "../ancillary/EventManager.ts";
import ValueManager from "../ancillary/ValueManager.ts";
import waitFor from "./waitFor.ts";
import Errors from "../errors/errors.ts";
import Radio from "../ancillary/Radio.ts";
import { init, destroy } from "../constants/symbols.ts";

export default class PowerPagesElement extends DOMNodeReference {
  // allow for indexing methods with symbols
  [key: symbol]: (...arg: any[]) => any;

  /**
   * Represents the 'yes' option of a boolean radio field.
   * This property is only available when the parent node
   * is a main field for a boolean radio input.
   */
  public declare yesRadio: Radio | undefined;
  /**
   * Represents the 'no' option of a boolean radio field.
   * This property is only available when the parent node
   * is a main field for a boolean radio input.
   */
  public declare noRadio: Radio | undefined;

  /**
   * Creates an instance of PowerPagesElement.
   * @param target - The CSS selector to find the desired DOM element.
   * @param root - Optionally specify the element within to search for the element targeted by 'target'
   * Defaults to 'document.body'
   */
  /******/ /******/ constructor(
    target: Element | string,
    root: Element = document.body,
    timeoutMs: number
  ) {
    super(target, root, timeoutMs);
  }

  //
  public async [init](): Promise<void> {
    /**
     * dynamically define the s.init method using our custom symbol
     * this makes it so that the s.init method cannot be accessed outside
     * of this package: i.e. by any consumers of the package
     */
    try {
      if (this.target instanceof HTMLElement) {
        this.element = this.target;
      } else {
        this.element = (await waitFor(
          this.target as string,
          this.root,
          false,
          this.timeoutMs
        )) as HTMLElement;
      }

      if (!this.element) {
        throw new Errors.NodeNotFoundError(this);
      }

      if (
        this.element.id &&
        this.element.querySelectorAll(
          `#${this.element.id} > input[type="radio"]`
        ).length > 0
      ) {
        await this._attachRadioButtons();
      }

      this.eventManager = new EventManager();
      this.visibilityManager = new VisibilityManager(this.element);
      this.valueManager = new ValueManager({
        element: this.element,
        isRadio: false,
        noRadio: this.noRadio,
        yesRadio: this.yesRadio,
      });

      this._valueSync();

      // we want to ensure that all method calls from the consumer have access to 'this'
      this._bindMethods();

      // when the element is removed from the DOM, destroy this
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (Array.from(mutation.removedNodes).includes(this.element)) {
            this[destroy]();
            observer.disconnect();
            break;
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      PowerPagesElement.instances.push(this);

      this.isLoaded = true;
    } catch (error) {
      const errorMessage: string =
        error instanceof Error ? error.message : String(error);
      throw new Errors.InitializationError(this, errorMessage);
    }
  }

  protected async _attachRadioButtons(): Promise<void> {
    if (!this.element) {
      console.error(
        "'this.element' not found: cannot attach radio buttons for ",
        this.target
      );
      return;
    }

    this.yesRadio = new Radio(
      this,
      'input[type="radio"][value="1"]',
      this.element,
      0,
      "truthy"
    );

    this.noRadio = new Radio(
      this,
      'input[type="radio"][value="0"]',
      this.element,
      0,
      "falsy"
    );

    await this.yesRadio[init]();
    await this.noRadio[init]();
  }

  public override clearValue(): void {
    // Handle radio button group if present
    if (this.yesRadio instanceof Radio && this.noRadio instanceof Radio) {
      this.yesRadio.clearValue();
      this.noRadio.clearValue();
    }
    super.clearValue();
  }

  /**
   * Unchecks both the yes and no radio buttons if they exist.
   * @returns - Instance of this [provides option to method chain]
   */
  public uncheckRadios(): DOMNodeReference {
    if (
      this.yesRadio instanceof DOMNodeReference &&
      this.noRadio instanceof DOMNodeReference
    ) {
      (this.yesRadio.element as HTMLInputElement).checked = false;
      (this.noRadio.element as HTMLInputElement).checked = false;
    } else {
      console.error(
        "[SYNACT] Attempted to uncheck radios for an element that has no radios"
      );
    }
    return this;
  }

  protected [destroy](): void {
    super[destroy]();
    // Destroy radio buttons if they exist
    this.yesRadio?.[destroy]();
    this.noRadio?.[destroy]();
    this.yesRadio = undefined;
    this.noRadio = undefined;

    this.eventManager!.destroy();
    this.eventManager = null;
    this.visibilityManager!.destroy();
    this.visibilityManager = null;
    this.valueManager!.destroy();
    this.valueManager = null;
  }
}
