/// <reference path="../globals.d.ts" />
/**
 * Provides abstract class `API` that allows basic create, read, and update operations in DataVerse via the PowerPages API
 * @method `createRecord` - Create a record in DataVerse
 * @method `getRecord<T>` - Get a record by ID from DataVerse
 * @method `getMultiple` - Get multiple records from DataVerse; with optional OData filtering
 * @method `updateRecord` - Update a record by ID in DataVerse
 */
declare abstract class API {
    /**
     * @param tableSetName The dataverse set name for the table that you are updating a record in
     * @param data The JSON of the fields and data that are to be updated on the targeted record
     * @returns a Promise resolving the successful results *[record id]* of the POST request, or rejecting the failed results *[error]* of the POST request.
     */
    static createRecord(tableSetName: string, data: JSON): Promise<string>;
    /**
     *
     * @param tableSetName The DataVerse SET name of the table being queried
     * @param recordID the GUID of the records to be retrieved
     * @param selectColumns *OPTIONAL* if desired, enter your own custom OData query for advanced GET results. Format = select=column1,column2,column3...
     * @returns a Promise resolving the successful results of the GET request, or rejecting the failed results of the GET request
     */
    static getRecord<T>(tableSetName: string, recordID: string, selectColumns?: string): Promise<T>;
    /**
     *
     * @param tableSetName The dataverse set name of the table being queried
     * @param queryParameters *OPTIONAL* the OData query parameters for refining search results: *format = $filter=filters&$select=columns*
     * @returns a Promise resolving the successful results of the GET request, or rejecting the failed results of the GET request
     */
    static getMultiple(tableSetName: string, queryParameters?: string): Promise<Array<object>>;
    /**
     *
     * @param tableSetName The dataverse set name for the table that you are updating a record in
     * @param recordId The GUID of the record that is being updated
     * @param data The JSON of the fields and data that are to be updated on the targeted record
     * @returns A Promise with the results of the API execution
     */
    static updateRecord(tableSetName: string, recordId: string, data: object): Promise<any>;
}
export default API;
