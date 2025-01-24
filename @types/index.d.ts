declare type Schema = {
  logicalName(): string;
  value(): object; // Adjust this type based on the structure of your schema values
};

declare const Page_Validators: any[];

declare interface ElementValue {
  value: any;
  checked?: boolean;
}

// Alias for QuerySelector
declare type QuerySelector = string;

interface ISystemForm extends Object {
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

interface IForm extends Partial<ISystemForm> {
  formxml: string;
}
