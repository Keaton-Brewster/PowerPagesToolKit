/* eslint-disable @typescript-eslint/no-explicit-any */
export default function defineCustomSetter<T extends object>(
  object: T,
  property: keyof T,
  customSetter: (value: any) => void
): void {
  // Get the original property descriptor from the instance itself (or its prototype chain).
  const originalDescriptor =
    Object.getOwnPropertyDescriptor(object, property) ||
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(object), property);

  // Store the value if no getter/setter exists
  let internalValue: any;

  Object.defineProperty(object, property, {
    get(): any {
      if (originalDescriptor?.get) {
        return originalDescriptor.get.call(this);
      }
      return internalValue;
    },

    set(newValue: any) {
      internalValue = newValue;

      if (originalDescriptor?.set) {
        originalDescriptor.set.call(this, newValue);
      }

      customSetter.call(this, newValue);
    },

    configurable: true,
    enumerable: originalDescriptor ? originalDescriptor.enumerable : true,
  });
}
