export default class FieldValidation {
  constructor(fieldLogicalName, fieldDisplayname, evaluationFunction) {
    this.fieldLogicalName = fieldLogicalName;
    this.fieldDisplayname = fieldDisplayname;
    this.evaluationFunction = evaluationFunction.bind(this);

    this.createValidator();
  }

  createValidator = function () {
    if (typeof Page_Validators == "undefined") return;
    // Create new validator
    var newValidator = document.createElement("span");
    newValidator.style.display = "none";
    newValidator.id = `${this.fieldLogicalName}Validator`;
    newValidator.controltovalidate = `${this.fieldLogicalName}`;
    newValidator.errormessage = `<a href='#${this.fieldDisplayname}_label'>${this.fieldDisplayname} is a required field</a>`;
    newValidator.validationGroup = ""; // Set this if you have set ValidationGroup on the form
    newValidator.initialvalue = "";
    newValidator.evaluationfunction = this.evaluationFunction;
    // Add the new validator to the page validators array:
    // eslint-disable-next-line no-undef
    Page_Validators.push(newValidator);
  };
}
