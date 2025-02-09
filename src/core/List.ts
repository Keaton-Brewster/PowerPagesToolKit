export default class List {
  private static _instance: List | null = null;
  private _root: HTMLElement;
  private _listItems: Set<HTMLElement> = new Set();
  private _observer: MutationObserver;

  private constructor() {
    // this all breaks down if a portal uses the 'new and improved' list feature
    const tableBody = document.querySelector("tbody");
    this._root = tableBody as HTMLElement;
    const rows = this._root.querySelectorAll("tr");
    rows.forEach((row) => {
      this._listItems.add(row);
    });

    this._observer = new MutationObserver(this._update.bind(this));
    this._observe();
  }

  static get(): List {
    if (!List._instance) List._instance = new List();
    return List._instance;
  }

  private _observe(): void {
    this._observer.observe(this._root, { childList: true });
  }

  private _update(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.removedNodes)) {
        if (this._listItems.has(node as HTMLElement)) {
          this._listItems.delete(node as HTMLElement);
        }
        if (this._root == node) {
          this._destroy();
        }
      }
    }

    const rows = this._root.querySelectorAll("tr");
    rows.forEach((row) => {
      this._listItems.add(row);
    });
  }

  private _destroy(): void {
    this._observer.disconnect();
    this._listItems.clear();
    List._instance = null;
  }

  public destroy(): void {
    this._destroy();
  }
}
