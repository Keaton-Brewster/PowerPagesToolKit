const eventMapping: Record<string, keyof HTMLElementEventMap> = {
  checkbox: "click",
  radio: "click",
  select: "change",
  "select-multiple": "change",
  textarea: "keyup",
  // Add other input types as needed
};

export default eventMapping;
