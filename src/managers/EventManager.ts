import DOMNodeReference from "@/core/DOMNodeReference.js";
import {
  observers,
  boundEventListeners,
  registerEventListener,
} from "@/constants/symbols.js";

export default class EventManager {
  protected src: DOMNodeReference;
  protected [observers]: Array<MutationObserver> = [];
  protected [boundEventListeners]: Array<IBoundEventListener> = [];

  constructor(target: DOMNodeReference) {
    this.src = target;
  }

  public [registerEventListener](
    element: Element,
    eventType: keyof HTMLElementEventMap,
    handler: (e: Event) => unknown
  ) {
    element.addEventListener(eventType, handler);

    this[boundEventListeners].push({
      element,
      handler,
      event: eventType,
    });
  }
}
