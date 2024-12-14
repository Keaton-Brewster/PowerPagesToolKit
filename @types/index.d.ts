/**
 * Interface representing an array of DOMNodeReference instances with additional methods.
 */
declare interface DOMNodeReferenceArray extends Array<DOMNodeReference> {
  /**
   * Hides all the containers of the DOMNodeReference instances in the array.
   */
  hideAll(): void;

  /**
   * Shows all the containers of the DOMNodeReference instances in the array.
   */
  showAll(): void;
}

declare type Schema = {
  logicalName(): string;
  value(): object; // Adjust this type based on the structure of your schema values
};

declare const Page_Validators: any[];
