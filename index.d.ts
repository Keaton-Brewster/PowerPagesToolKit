declare module powerpagestoolkit {
  interface DOMNodeReference {
    constructor(querySelector: string);
    element: HTMLElement | null;
    isLoaded: boolean;

    init(): Promise<this>;

    hide(): void;
    show(): void;
    hideParent(): void;
    showParent(): void;
    hideContainer(): void;
    showContainer(): void;
    setValue(value: string): void;
    getValue(): string;
    append(...elements: HTMLElement[]): void;
    after(...elements: HTMLElement[]): void;
    getLabel(): HTMLElement;
    appendToLabel(...elements: HTMLElement[]): void;
    addClickListener(eventHandler: () => void): void;
    addChangeListener(eventHandler: () => void): void;
    uncheckRadios(): void;
    createValidation(
      evaluationFunction: (value: any) => boolean,
      fieldDisplayName: string
    ): void;
    addLabelTooltip(text: string): void;
    setTextContent(text: string): void;
    onceLoaded(callback: (instance: this) => void): void;
  }

  export function createDOMNodeReference(
    querySelector: string
  ): Promise<DOMNodeReference>;

  interface Schema {
    logicalName(): string;
    value(): any; // Adjust this type based on the structure of your schema values
  }

  export interface API {
    /**
     * Creates a new record in DataVerse.
     * @param schema An instance of a schema class, containing the desired information for the POST request.
     * @returns A Promise resolving the successful results (record ID) of the POST request, or rejecting with the error.
     */
    createRecord(schema: Schema): Promise<string>;

    /**
     * Retrieves a single record from DataVerse.
     * @param tableSetName The DataVerse SET name of the table being queried.
     * @param recordID The GUID of the record to be retrieved.
     * @param selectColumns *OPTIONAL* Custom OData query for advanced GET results. Format: select=column1,column2,column3...
     * @returns A Promise resolving the successful results of the GET request, or rejecting with the error.
     */
    getRecord(
      tableSetName: string,
      recordID: string,
      selectColumns?: string
    ): Promise<any>; // Adjust return type as necessary

    /**
     * Retrieves multiple records from DataVerse.
     * @param tableSetName The DataVerse SET name of the table being queried.
     * @param queryParameters *OPTIONAL* OData query parameters for refining search results: format = $filter=filters&$select=columns
     * @returns A Promise resolving the successful results of the GET request, or rejecting with the error.
     */
    getMultiple(tableSetName: string, queryParameters?: string): Promise<any>; // Adjust return type as necessary
  }
}
