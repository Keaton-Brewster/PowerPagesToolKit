import DOMNodeReference from "./DOMNodeReference.js";

/******/ /******/ /******/ export default class ListItem extends DOMNodeReference {
  /**
   * @property The First Column in this specific list item
   */
  public declare firstColumn: HTMLElement;

  constructor(target: HTMLElement | string) {
    super(target);
    this.firstColumn = this.element.querySelector(
      "div[role='gridcell']"
    ) as HTMLElement;
  }

  public removeTarget() {
    this.element.querySelectorAll("a").forEach((el) => {
      el.removeAttribute("href");
    });
  }

  public setFirstRowLink(path: string): ListItem {
    // get the first row, turn it into an <a href="path"/>
    const a = this.firstColumn?.querySelector("a");
    if (a) {
      a.href = path;
    } else {
      const a = document.createElement("a");
      a.innerHTML = this.firstColumn.innerHTML;
      a.href = path;
    }

    return this;
  }
}
