import type PowerPagesElement from "./PowerPagesElement.ts";

export default class PowerPagesElementArray extends Array<PowerPagesElement> {
  /**
   * Hides all the containers of the PowerPagesElement instances in the array.
   */
  hideAll(this: PowerPagesElementArray) {
    this.forEach((instance: PowerPagesElement) => instance.hide());
    return this;
  }

  /**
   * Shows all the containers of the PowerPagesElement instances in the array.
   */

  showAll(this: PowerPagesElementArray) {
    this.forEach((instance: PowerPagesElement) => instance.show());
    return this;
  }
}
