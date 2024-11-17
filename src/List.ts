import DOMNodeReference from "./DOMNodeReference.js";
import ListItem from "./ListItem.js";

/******/ /******/ /******/ export default class List extends DOMNodeReference {
  /**
   * @property an array of List Items contained within this list
   */
  public declare listItems: ListItem[];

  constructor(target: HTMLElement | string) {
    super(target);
  }
}
