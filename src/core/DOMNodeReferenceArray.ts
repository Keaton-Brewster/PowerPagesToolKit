import DOMNodeReference from "./DOMNodeReference.js";

export default class DOMNodeReferenceArray extends Array<DOMNodeReference> {
  /**
   * Hides all the containers of the DOMNodeReference instances in the array.
   */
  hideAll(this: DOMNodeReferenceArray) {
    this.forEach((instance: DOMNodeReference) => instance.hide());
    return this;
  }

  /**
   * Shows all the containers of the DOMNodeReference instances in the array.
   */

  showAll(this: DOMNodeReferenceArray) {
    this.forEach((instance: DOMNodeReference) => instance.show());
    return this;
  }
}
