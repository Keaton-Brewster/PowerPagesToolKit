/**
 * For use in setting up event management in the instances of PowerPagesElement
 * @see {@link PowerPagesElement}
 */
export const EventTypes = {
  CHECKBOX: "click",
  RADIO: "click",
  SELECT: "change",
  TEXT: "keyup",
  DEFAULT: "input",
} as const;
