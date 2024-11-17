import DOMNodeReference, { _initSymbol } from "./DOMNodeReference.js";

/**
 *
 * @returns
 */
export default async function (): Promise<DOMNodeReference> {
  try {
    const instance = new DOMNodeReference("div.ms-DetailsList");
    await instance[_initSymbol]();

    return new Proxy(instance, {
      get: (target, prop) => {
        // do not proxy the initialization method
        // init() is only needed in this factory function
        if (prop.toString().startsWith("_")) return undefined;

        // proxy the class to wrap all methods in the 'onceLoaded' method, to make sure the
        // element is always available before executing method
        const value = target[prop as keyof DOMNodeReference];
        if (typeof value === "function" && prop !== "onceLoaded") {
          return (...args: any[]) => {
            target.onceLoaded(() => value.apply(target, args));
            return target;
          };
        }
        return value;
      },
    });
  } catch (e) {
    throw new Error(e as string);
  }
}
