//@ts-nocheck
import safeAjax from "../utils/safeAjax.ts";

interface ODataJSON extends object {
  [key: `${string}@odata.bind` | string]: any;
}

/**
 * Provides abstract class `API` that allows basic create, read, and update operations in DataVerse via the PowerPages API
 * @method `createRecord` - Create a record in DataVerse
 * @method `getRecord<T>` - Get a record by ID from DataVerse
 * @method `getMultiple` - Get multiple records from DataVerse; with optional OData filtering
 * @method `updateRecord` - Update a record by ID in DataVerse
 */
abstract class API {
  /**
   * @param tableSetName The dataverse set name for the table that you are updating a record in
   * @param data The JSON of the fields and data that are to be updated on the targeted record
   * @returns a Promise resolving the successful results *[record id]* of the POST request, or rejecting the failed results *[error]* of the POST request.
   */
  static createRecord(tableSetName: string, data: ODataJSON): Promise<string> {
    return new Promise((resolve, reject) => {
      safeAjax({
        type: "POST",
        url: `/_api/${tableSetName}`,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function (_response, _status, xhr) {
          resolve(xhr.getResponseHeader("entityid"));
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }
  /**
   *
   * @param tableSetName The DataVerse SET name of the table being queried
   * @param recordID the GUID of the records to be retrieved
   * @param selectColumns *OPTIONAL* if desired, enter your own custom OData query for advanced GET results. Format = select=column1,column2,column3...
   * @returns a Promise resolving the successful results of the GET request, or rejecting the failed results of the GET request
   */
  static getRecord<T>(
    tableSetName: string,
    recordID: string,
    selectColumns?: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const url = `/_api/${tableSetName}(${recordID})${
        selectColumns ? `?$${selectColumns}` : ""
      }`;

      safeAjax({
        type: "GET",
        url: url,
        success: resolve,
        error: reject,
      });
    });
  }
  /**
   *
   * @param tableSetName The dataverse set name of the table being queried
   * @param queryParameters *OPTIONAL* the OData query parameters for refining search results: *format = $filter=filters&$select=columns*
   * @returns a Promise resolving the successful results of the GET request, or rejecting the failed results of the GET request
   */
  static getMultiple(
    tableSetName: string,
    queryParameters?: string
  ): Promise<Array<object>> {
    return new Promise((resolve, reject) => {
      // Construct the URL based on the presence of query parameters
      const url = `/_api/${tableSetName}${
        queryParameters ? `?${queryParameters}` : ""
      }`;

      safeAjax({
        type: "GET",
        url: url,
        success: function (response) {
          resolve(response.value);
        },
        error: reject,
      });
    });
  }

  /**
   *
   * @param tableSetName The dataverse set name for the table that you are updating a record in
   * @param recordId The GUID of the record that is being updated
   * @param data The JSON of the fields and data that are to be updated on the targeted record
   * @returns A Promise with the results of the API execution
   */
  static updateRecord(
    tableSetName: string,
    recordId: string,
    data: ODataJSON
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = `/_api/${tableSetName}(${recordId})`;

      safeAjax({
        type: "PATCH",
        url: url,
        data: JSON.stringify(data),
        success: resolve,
        error: reject,
      });
    });
  }
}

export default API;
