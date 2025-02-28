import DOMNodeReference from "./DOMNodeReference.ts";
import ValueManager from "./ValueManager.ts";
import Errors from "../errors/errors.ts";
import { init, destroy } from "../constants/symbols.ts";

export default class Radio extends DOMNodeReference {
  // allow for indexing methods with symbols
  [key: symbol]: (...arg: any[]) => any;

  public radioType: RadioType | undefined;
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
      await super[init]();

      this.valueManager = new ValueManager(this);

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
      throw new Errors.InitializationError(this, errorMessage);
    }
  }

  override [destroy](): void {
    super[destroy]();
    this.radioParent = undefined;
    this.radioType = undefined;
  }
}
