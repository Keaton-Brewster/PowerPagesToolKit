export declare global {
  /**
   * Interface representing an array of DOMNodeReference instances with additional methods.
   */
  interface DOMNodeReferenceArray extends Array<DOMNodeReferenceProxy> {
    /**
     * Hides all the containers of the DOMNodeReference instances in the array.
     */
    hideAll(): void;

    /**
     * Shows all the containers of the DOMNodeReference instances in the array.
     */
    showAll(): void;
  }

  interface Schema {
    logicalName(): string;
    value(): object; // Adjust this type based on the structure of your schema values
  }

  const Page_Validators: any[];
}
