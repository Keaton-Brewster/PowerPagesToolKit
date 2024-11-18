import { createMultipleDOMNodeReferences } from "./createDOMNodeReferences.js";
import DOMNodeReference, { _init } from "./DOMNodeReference.js";
import ListItem from "./ListItem.js";
export const _listInit = Symbol("_listInit");

/******/ /******/ /******/ export default class List extends DOMNodeReference {
  /**
   * @property an array of List Items contained within this list
   */
  public declare listItems: ListItem[];

  constructor(target: HTMLElement | string) {
    super(target);
    this.listItems = [];
  }

  public async [_listInit](): Promise<void> {
    await super[_init]();
    const li = await createMultipleDOMNodeReferences(
      "div.ms-DetailsRow-fields"
    );
    console.log(li);
    setTimeout(() => {
      console.log(li);
    }, 1000);
  }
}
