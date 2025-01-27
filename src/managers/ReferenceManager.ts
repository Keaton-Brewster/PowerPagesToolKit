import DOMNodeReference from "@/core/DOMNodeReference.js";

export default abstract class ReferenceManager {
  static instances: Set<DOMNodeReference> = new Set();

  static getInstance<T>(target: T): DOMNodeReference | undefined {
    for (const instance of this.instances) {
      if (instance.target === target) {
        return instance; // Return the matching instance
      }
    }
    return undefined; // If no match found
  }
}

abstract class ReferenceFamily extends ReferenceManager {}
