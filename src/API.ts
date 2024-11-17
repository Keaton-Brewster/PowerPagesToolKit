//@ts-nocheck
import safeAjax from "./safeAjax.js";
const API = {
  /**
   *
   * @param {Class} schema an instance of a schema class, containing the desired information for the POST request
   * @returns a Promise resolving the successful results *[record id]* of the POST request, or rejecting the failed results *[error]* of the POST request.
   */
  createRecord(schema): Promise<string> {
    return new Promise((resolve, reject) => {
      safeAjax({
        type: "POST",
        url: `/_api/${schema.logicalName()}`,
        data: schema.value(),
        contentType: "application/json",
        success: function (response, status, xhr) {
          resolve(xhr.getResponseHeader("entityid"));
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  },
  /**
   *
   * @param {string} tableSetName The DataVerse SET name of the table being queried
   * @param {string} recordID the GUID of the records to be retrieved
   * @param {string} selectColumns *OPTIONAL* if desired, enter your own custom OData query for advanced GET results. Format = select=column1,column2,column3...
   * @returns a Promise resolving the successful results of the GET request, or rejecting the failed results of the GET request
   */
  getRecord(
    tableSetName: string,
    recordID: string,
    selectColumns: string
  ): Promise<object> {
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
  },
  /**
   *
   * @param {String} tableSetName The DataVerse SET name of the table being queried
   * @param {String} queryParameters *OPTIONAL* the OData query parameters for refining search results: *format = $filter=filters&$select=columns*
   * @returns a Promise resolving the successful results of the GET request, or rejecting the failed results of the GET request
   */
  getMultiple(
    tableSetName: string,
    queryParameters: string
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
  },
};

export default API;
