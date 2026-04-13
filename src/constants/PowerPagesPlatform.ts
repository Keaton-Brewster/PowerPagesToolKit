/**
 * Centralizes all PowerPages platform-specific DOM conventions.
 *
 * When Microsoft changes how PowerPages renders controls, this is the only
 * file that needs to be updated. Consumers can also import these to write
 * their own selectors that stay in sync with the library's assumptions.
 */

/** CSS selector strings for locating PowerPages-rendered DOM elements */
export const Selectors = {
  /** Label element for a given field: `#${elementId}_label` */
  label: (elementId: string): string => `#${elementId}_label`,

  /** Attribute selector for the date value node inside a date control */
  dateFormatNode: "[data-date-format]",

  /** Attribute selector for a section or tab by logical name */
  sectionOrTab: (name: string): string => `[data-name="${name}"]`,

  /** ID selector for a control by its logical name */
  controlById: (id: string): string => `#${id}`,

  /**
   * Selector for detecting boolean radio direct children of a container.
   * Used during init to determine if a field is a boolean radio group.
   */
  booleanRadioChildren: (parentId: string): string =>
    `#${parentId} > input[type="radio"]`,

  /** Selector for the truthy (Yes) radio option in a boolean radio group */
  truthyRadio: 'input[type="radio"][value="1"]',

  /** Selector for the falsy (No) radio option in a boolean radio group */
  falsyRadio: 'input[type="radio"][value="0"]',
};

/** Predicate functions for detecting PowerPages-specific DOM characteristics */
export const Detect = {
  /**
   * Returns true if an element ID matches the PCF control container naming convention.
   * PowerPages prefixes PCF wrapper element IDs with "pcfcontrol" (case-insensitive).
   */
  isPCFControl: (id: string | undefined): boolean =>
    id?.toLowerCase().startsWith("pcfcontrol") ?? false,

  /**
   * Returns true if the element is a date input in a PowerPages form.
   * PowerPages sets `data-type="date"` on date input elements.
   */
  isDateInput: (element: HTMLElement): boolean =>
    (element as HTMLInputElement).dataset?.type === "date",

  /**
   * Returns true if the element's parent hosts a PCF-based multiselect control.
   * PowerPages renders multiselect option sets via a PCF whose container class includes "multiselect".
   */
  isMultiSelect: (element: HTMLElement): boolean =>
    Array.from(element.parentElement?.querySelectorAll("*") ?? []).some(
      (node) =>
        Array.from(node.classList).some((cls) =>
          cls.toLowerCase().includes("multiselect")
        )
    ),
};
