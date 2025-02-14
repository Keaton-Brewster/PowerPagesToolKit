import type DOMNodeReference from "../core/DOMNodeReference.ts";

declare type EventType = string;
declare type Handler = (this: DOMNodeReference, ...args: any[]) => void;
declare type Listeners = Set<DOMNodeReference>;

/********/ /********/ export default class EventManager {
  private readonly events: Map<EventType, Handler> = new Map();
  private readonly listeners: Map<EventType, Listeners> = new Map();
  private readonly dependencyHandlers: Set<[DOMNodeReference, Handler]> =
    new Set();
  private observers: Array<MutationObserver | ResizeObserver> = [];
  private boundListeners: Array<BoundEventListener> = [];

  constructor() {}

  public dispatchDependencyHandlers(): void {
    for (const [dependency, handler] of this.dependencyHandlers) {
      handler.call(dependency);
    }
  }

  public registerDependent(
    dependency: DOMNodeReference,
    handler: Handler
  ): true | false {
    try {
      this.dependencyHandlers.add([dependency, handler]);
      return true;
    } catch {
      return false;
    }
  }

  public registerEvent(event: EventType, handler: Handler): true | false {
    if (this.events.has(event)) {
      console.error("Event registration has already been defined for: ", event);
      return false;
    }
    this.listeners.set(event, new Set());
    this.events.set(event, handler);
    return true;
  }

  public registerListener(
    event: EventType,
    listener: DOMNodeReference
  ): true | false {
    if (this.events.has(event)) {
      const listeners: Listeners = this.listeners.get(event) ?? new Set();
      listeners.add(listener);
      this.listeners.set(event, listeners);
      return true;
    } else {
      console.error("No event registration found for: ", event);
      return false;
    }
  }

  public emit(eventType: EventType, ...args: any[]): void {
    if (this.events.has(eventType)) {
      //
      const event: Handler = this.events.get(eventType) as Handler;
      const listeners: Listeners | undefined = this.listeners.get(eventType);
      //
      if (!listeners) return;
      //
      for (const listener of listeners) {
        event.call(listener, ...args);
      }
      //
    } else {
      console.error("Event not found in EventRegistry: ", eventType);
    }
    return;
  }

  public stopListening(listener: DOMNodeReference): void {
    for (const [_event, listeners] of this.listeners) {
      if (listeners.has(listener)) listeners.delete(listener);
    }
  }

  public registerObserver(
    observer: MutationObserver | ResizeObserver,
    observerOptions: {
      nodeToObserve: Element;
      options: Partial<ResizeObserverOptions> | Partial<MutationObserverInit>;
    }
  ): void {
    const { nodeToObserve, options } = observerOptions;
    observer.observe(nodeToObserve, options);
    this.observers.push(observer);
  }

  public registerDOMEventListener(
    element: Element,
    eventType: keyof HTMLElementEventMap,
    handler: (e: Event) => unknown
  ): void {
    element.addEventListener(eventType, handler);

    this.boundListeners.push({
      element,
      handler,
      event: eventType,
    });
  }

  public destroy(): void {
    // Remove all bound event listeners
    this.boundListeners?.forEach((binding) => {
      binding.element?.removeEventListener(binding.event, binding.handler);
    });
    this.boundListeners = []; // Clear the array

    // Disconnect all observers
    this.observers?.forEach((observer) => {
      observer.disconnect();
    });
    this.observers = []; // Clear the array

    this.events.clear();

    this.dependencyHandlers.clear();

    this.listeners.clear();
  }
}
