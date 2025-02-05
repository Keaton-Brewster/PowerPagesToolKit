declare interface CreationOptions {
  /**
   * Should this call return an array of instantiated references, or just a single?
   * Defaults to false, returning a single instance.
   */
  multiple?: (() => boolean) | boolean;

  /**
   * Optionally specify the element within which to search for the element targeted by 'target'.
   * Defaults to 'document.body'.
   */
  root?: HTMLElement;

  /**
   * Optionally specify the amount of time that should be waited to find the targeted element before throwing an error.
   * Useful for async DOM loading. Relies on MutationObserver.
   * WARNING: Implementing multiple references with timeout can result in infinite loading.
   */
  timeoutMs?: number;
}

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
  setRequired?: [
    isRequired: () => boolean,
    isValid: (isRequired: boolean) => boolean
  ];
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

declare interface CreationOptions {
  /**
   * Should this call return an array of instantiated references, or just a single?
   * Defaults to false, returning a single instance.
   */
  multiple?: (() => boolean) | boolean;

  /**
   * Optionally specify the element within which to search for the element targeted by 'target'.
   * Defaults to 'document.body'.
   */
  root?: HTMLElement;

  /**
   * Optionally specify the amount of time that should be waited to find the targeted element before throwing an error.
   * Useful for async DOM loading. Relies on MutationObserver.
   * WARNING: Implementing multiple references with timeout can result in infinite loading.
   */
  timeoutMs?: number;
}

declare const Page_Validators: any[];

declare interface ElementValue {
  value: any;
  checked?: boolean;
}

declare type RadioType = "truthy" | "falsy";

declare interface BoundEventListener {
  element: Element;
  event: keyof HTMLElementEventMap;
  handler: (e: Event) => unknown;
}

declare type FormElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | HTMLSpanElement
  | HTMLButtonElement
  | HTMLFieldSetElement;
