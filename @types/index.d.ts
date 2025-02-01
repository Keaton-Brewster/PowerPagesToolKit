// dist/types/index.d.ts

// Alias for QuerySelector
declare type QuerySelector = string;

declare interface SystemForm extends Object {
  "@odata.context": string;
  "@odata.etag": string;
  "overwritetime@OData.Community.Display.V1.FormattedValue": string;
  overwritetime: Date;
  "isdesktopenabled@OData.Community.Display.V1.FormattedValue": string;
  isdesktopenabled: boolean;
  "publishedon@OData.Community.Display.V1.FormattedValue": Date;
  publishedon: Date;
  "_organizationid_value@OData.Community.Display.V1.FormattedValue": string;
  "_organizationid_value@Microsoft.Dynamics.CRM.associatednavigationproperty": string;
  "_organizationid_value@Microsoft.Dynamics.CRM.lookuplogicalname": string;
  _organizationid_value: string;
  formxml: string;
  introducedversion: string;
  "isairmerged@OData.Community.Display.V1.FormattedValue": string;
  isairmerged: boolean;
  "istabletenabled@OData.Community.Display.V1.FormattedValue": string;
  istabletenabled: boolean;
  solutionid: string;
  formidunique: string;
  "ismanaged@OData.Community.Display.V1.FormattedValue": string;
  ismanaged: boolean;
  "isdefault@OData.Community.Display.V1.FormattedValue": string;
  isdefault: boolean;
  "objecttypecode@OData.Community.Display.V1.FormattedValue": string;
  objecttypecode: string;
  "type@OData.Community.Display.V1.FormattedValue": string;
  type: number;
  "componentstate@OData.Community.Display.V1.FormattedValue": string;
  componentstate: number;
  "formpresentation@OData.Community.Display.V1.FormattedValue": string;
  formpresentation: number;
  "formactivationstate@OData.Community.Display.V1.FormattedValue": string;
  formactivationstate: number;
  name: string;
  "versionnumber@OData.Community.Display.V1.FormattedValue": string;
  versionnumber: number;
  formjson: string;
  description: string;
  formid: string;
}

declare interface Form extends Partial<SystemForm> {
  formxml: string;
}

declare interface BusinessRule {
  /**
   * @param condition A function that returns a boolean to determine
   * the visibility of the target element. If `condition()` returns true, the element is shown;
   * otherwise, it is hidden.
   
   * @param clearValuesOnHide Should the values in the targeted field be cleared when hidden? Defaults to true
   */
  setVisibility?: [condition: () => boolean, clearValuesOnHide?: boolean];
  /**
   * @param isRequired Function determining if field is required
   * @param isValid Function validating field input.
   */
  setRequired?: [isRequired: () => boolean, isValid: () => boolean];
  /**
   * @param condition A function to determine if the value provided should be applied to this field
   * @param value The value to set for the HTML element.
   * for parents of boolean radios, pass true or false as value, or
   * an expression returning a boolean
   */
  setValue?: [condition: () => boolean, value: () => any | any];
  /**
   * @param condition A function to determine if this field
   * should be enabled in a form, or disabled. True || 1 = disabled. False || 0 = enabled
   */
  setDisabled?: () => boolean;
}
