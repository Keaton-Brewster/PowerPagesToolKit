/**
 * so far this whole thing is a moot point
 * Microsoft provides no way to get important specific information
 * about the records represented by each 'row' in a list
 * rendering this effort particularly useless
 *
 * Saving for in case things change in the future and this
 * could be re-factored/extended to provide some usable value
 */

export const _init: symbol = Symbol("_init");

/**
 * Provides information about how to target elements in
 * the construction of the list
 */
interface ListOptions {
  containerSelector: string;
  rowSelector: string;
  cellSelector: string;
}

interface ListItem extends Array<Element> {}

export default class List {
  public items: ListItem[] = [];
  private options: ListOptions;
  private container: HTMLElement | null = null;

  constructor(options: Partial<ListOptions> = {}) {
    this.options = {
      containerSelector: '[role="grid"]',
      rowSelector: '[role="row"]',
      cellSelector: '[role="gridcell"]',
      ...options,
    };
  }

  public async [_init](): Promise<List> {
    this.container = document.querySelector(this.options.containerSelector);
    if (!this.container) {
      throw new Error("List container not found");
    }

    const rows = this.container.querySelectorAll(this.options.rowSelector);

    rows.forEach((row) => {
      const cells = row.querySelectorAll(this.options.cellSelector);
      if (cells.length) {
        this.items.push(Array.from(cells));
      }
    });

    return this;
  }
}
