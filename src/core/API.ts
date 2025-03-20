import safeAjax from "../utils/safeAjax.ts";

interface ODataJSON extends Object {
  [key: `${string}@odata.bind` | string]: any;
}

/**
 * Provides abstract class `API` that allows basic create, read, and update operations in DataVerse via the PowerPages API
 * @method `createRecord` - Create a record in DataVerse
 * @method `getRecord<T>` - Get a record by ID from DataVerse
 * @method `getMultiple<T>` - Get multiple records from DataVerse; with optional OData filtering
 * @method `updateRecord` - Update a record by ID in DataVerse
 * @method `request<T>` - Build a custom request for advanced customizations
 */
abstract class API {
  /**
   * @param tableSetName The dataverse set name for the table that you are updati a record in
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
        success: function (_response: any, _status: any, xhr: any) {
          resolve(xhr.getResponseHeader("entityid"));
        },
        error: (error: unknown) => {
          reject(error);
        },
      });
    });
  }

  /**
   *
   * @param tableSetName The DataVerse SET name of the table being queried
   * @param recordID the GUID of the records to be retrieved
   * @param ODataQueryString *OPTIONAL* if desired, enter your own custom OData query for advanced GET results. e.g.: $select=column1,column2,column3
   * @returns a Promise resolving the successful results of the GET request, or rejecting the failed results of the GET request
   */
  static getRecord<T>(
    tableSetName: string,
    recordID: string,
    ODataQueryString?: string
  ): Promise<T> {
    let cleanedQuery: string = "";
    if (ODataQueryString) {
      cleanedQuery = ODataQueryString.startsWith("?")
        ? ODataQueryString.slice(1, ODataQueryString.length)
        : "?" + ODataQueryString;
    }

    return new Promise((resolve, reject) => {
      const url = `/_api/${tableSetName}(${recordID})${cleanedQuery}`;

      safeAjax({
        type: "GET",
        url: url,
        success: resolve,
        error: reject,
      });
    });
  }

  /**
   * More flexible method for building completely custom queries
   */
  static request<T>(query: string, options?: JQuery.AjaxSettings): Promise<T> {
    return new Promise((success, error) => {
      const url = `/_api/${query}`;
      safeAjax({
        url,
        success,
        error,
        ...options,
      });
    });
  }

  /**
   *
   * @param tableSetName The dataverse set name of the table being queried
   * @param queryParameters *OPTIONAL* the OData query parameters for refining search results: *format = $filter=statecode eq 0&$select=column1,column2...
   * @returns a Promise resolving the successful results of the GET request, or rejecting the failed results of the GET request
   */
  static getMultiple<T>(
    tableSetName: string,
    queryParameters?: string
  ): Promise<T[]> {
    let cleanedQuery: string = "";
    if (queryParameters) {
      cleanedQuery = queryParameters.startsWith("?")
        ? queryParameters.slice(1, queryParameters.length)
        : "?" + queryParameters;
    }
    return new Promise((resolve, error) => {
      // Construct the URL based on the presence of query parameters
      const url = `/_api/${tableSetName}${cleanedQuery}`;

      safeAjax({
        type: "GET",
        url: url,
        success: function (response: any) {
          resolve(response.value);
        },
        error,
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
  static updateRecord<T>(
    tableSetName: string,
    recordId: string,
    data: ODataJSON
  ): Promise<T> {
    return new Promise((success, error) => {
      const url = `/_api/${tableSetName}(${recordId})`;

      safeAjax({
        type: "PATCH",
        url: url,
        data: JSON.stringify(data),
        success,
        error,
      });
    });
  }
}

export default API;
