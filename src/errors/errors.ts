import type DOMNodeReference from "../ancillary/DOMNodeReference.ts";

class CustomError extends Error {
  public node: DOMNodeReference;
  constructor(node: DOMNodeReference, message: string) {
    super(message);

    this.node = node;

    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class InitializationError extends CustomError {
  constructor(node: DOMNodeReference, error: string) {
    super(
      node,
      `There was an error initializing a DOMNodeReference for target: ${node.target}, :: ${error}`
    );
  }
}

class NodeNotFoundError extends CustomError {
  constructor(node: DOMNodeReference) {
    super(node, `The targeted DOM element was not found: ${node.target}`);
  }
}

class Page_ValidatorsNotFoundError extends CustomError {
  constructor(node: DOMNodeReference) {
    super(node, "Page_Validators could not be found");
  }
}

class BusinessRuleError extends CustomError {
  constructor(node: DOMNodeReference) {
    super(node, `Error applying business rule to target: ${node.target}`);
  }
}

class SelfReferenceError extends CustomError {
  constructor(node: DOMNodeReference) {
    super(
      node,
      "Self-referential dependency found. A DOMNodeReference cannot depend on itself"
    );
  }
}

class LabelNotFoundError extends CustomError {
  constructor(node: DOMNodeReference) {
    super(node, `No label could be found for the target: ${node.target}`);
  }
}

class IncorrectParameterError extends CustomError {
  constructor(
    node: DOMNodeReference,
    functionName: string,
    argName: string,
    expectedTypes: string[],
    receivedType: any
  ) {
    const concatTypes = expectedTypes.join(" or ");

    super(
      node,
      `${functionName} expects ${argName} to be of type ${concatTypes}. Received: ${
        receivedType === null ? "null" : typeof receivedType
      }`
    );
  }
}

const Errors = {
  NodeNotFoundError,
  InitializationError,
  Page_ValidatorsNotFoundError,
  BusinessRuleError,
  SelfReferenceError,
  LabelNotFoundError,
  IncorrectParameterError,
};

export default Errors;
