import type DOMNodeReference from "../ancillary/DOMNodeReference.ts";
import type PowerPagesElement from "../core/PowerPagesElement.ts";

declare global {
  type EventCallback = () => any;

  interface CreationOptions {
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

  interface SystemForm extends Object {
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

  interface Form extends Partial<SystemForm> {
    formxml: string;
  }

  type EvaluationFunction<T = any[]> = (
    this: DOMNodeReference,
    ...args: T[]
  ) => boolean;

  type EvaluationResults<T extends EvaluationFunction> = ReturnType<T>;

  type IsRequired = EvaluationResults<EvaluationFunction>;

  /**
   * Configuration function for determining the required level, and field validity of the given fields
   * @param isRequired - Function determining if field is required
   * @param isRequired.this - Reference to this PowerPagesElement
   * @param isValid - Function validating field input.
   * @param isValid.this - Reference to this PowerPagesElement
   * @param isValid.isRequiredResult - Only available if 'isRequired' is also returned from the configuration function
   */
  interface FieldValidationRules {
    isRequired?: EvaluationFunction;
    isValid?: EvaluationFunction<IsRequired>;
  }

  interface BusinessRule {
    /**
   * @param condition A function that returns a boolean to determine
   * the visibility of the target element. If `condition()` returns true, the element is shown;
   * otherwise, it is hidden.
   
   */
    setVisibility?: EvaluationFunction;

    setRequirements?: () => FieldValidationRules;

    /**
     * @param condition A function to determine if the value provided should be applied to this field
     * @param value The value to set for the HTML element.
     * for parents of boolean radios, pass true or false as value, or
     * an expression returning a boolean
     */
    setValue?: () => {
      condition: EvaluationFunction;
      value: (() => any) | any;
    };
    /**
     * @param condition A function to determine if this field
     * should be enabled in a form, or disabled. True || 1 = disabled. False || 0 = enabled
     */
    setDisabled?: EvaluationFunction;
  }

  // This helper checks that an array type has at least one element.
  // If T is empty, it “fails” by evaluating to a string literal.
  type NonEmptyArray<T extends unknown[]> = T extends []
    ? "Error: Dependency array must have at least one element"
    : T;

  // Now, define DependencyArray so that it is essentially [T, ...T[]]
  // but if someone passes an empty array (i.e. []), the type becomes a custom error.
  type DependencyArray<T> = NonEmptyArray<[T, ...T[]]>;

  type DependencyHandler = () => void;

  interface BusinessRuleHandler extends DependencyHandler {}

  type Dependents = Map<PowerPagesElement, DependencyHandler>;

  type ValueElement =
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement
    | HTMLOptionElement;

  const Page_Validators: any[];

  interface ElementValue {
    value: any;
    checked?: boolean;
  }

  type RadioType = "truthy" | "falsy";

  interface BoundEventListener {
    element: Element;
    event: keyof HTMLElementEventMap;
    handler: (e: Event) => unknown;
  }

  type FormElement =
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement
    | HTMLSpanElement
    | HTMLButtonElement
    | HTMLFieldSetElement;

  type PhoneNumberFormats =
    | "xxx-xxx-xxxx"
    | "(xxx) xxx-xxxx"
    | "xxx xxx-xxxx"
    | "xxx.xxx.xxxx";

  type CountryCodeFormats = "+" | "()";

  type CurrencySymbol = "$" | "€" | "£" | "¥" | "¢";

  interface InputMaskOptions {
    format?: PhoneNumberFormats;
    countryCode?: CountryCodeFormats;
    prefix?: CurrencySymbol; // Currency symbol (e.g., "$")
    decimalPlaces?: number; // Number of decimal places (default: 2)
    thousandsSeparator?: string; // Character for separating thousands (e.g., ",")
    decimalSeparator?: string; // Character for decimal point (e.g., ".")
    allowNegative?: boolean; // Whether to allow negative values
  }
}
