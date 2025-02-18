import DOMNodeReference from "./DOMNodeReference.ts";
import waitFor from "../core/waitFor.ts";
import { init, destroy } from "../constants/symbols.ts";
import EventManager from "./EventManager.ts";
import ValueManager from "./ValueManager.ts";
import VisibilityManager from "./VisibilityManager.ts";
import {
  DOMNodeInitializationError,
  DOMNodeNotFoundError,
} from "../errors/errors.ts";

export default class Radio extends DOMNodeReference {
  // allow for indexing methods with symbols
  [key: symbol]: (...arg: any[]) => any;

  protected radioType: RadioType | null = null;
  public declare radioParent: DOMNodeReference | undefined;

  constructor(
    parent: DOMNodeReference,
    target: Element | string,
    root: Element = document.body,
    timeoutMs: number,
    radioType: RadioType
  ) {
    super(target, root, timeoutMs);

    this.radioParent = parent;
    this.radioType = radioType;
  }

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
        throw new DOMNodeNotFoundError(this);
      }

      this.eventManager = new EventManager();
      this.visibilityManager = new VisibilityManager(this.element);
      this.valueManager = new ValueManager({
        element: this.element,
        isRadio: true,
        radioParent: this.radioParent,
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

      DOMNodeReference.instances.push(this);

      this.isLoaded = true;
    } catch (error) {
      const errorMessage: string =
        error instanceof Error ? error.message : String(error);
      throw new DOMNodeInitializationError(this, errorMessage);
    }
  }

  override [destroy](): void {
    super[destroy]();
    this.radioParent = undefined;

    this.eventManager!.destroy();
    this.eventManager = null;
    this.visibilityManager!.destroy();
    this.visibilityManager = null;
    this.valueManager!.destroy();
    this.valueManager = null;
  }
}
