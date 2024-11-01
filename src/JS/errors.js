export class DOMNodeInitializationError extends Error {
  constructor(instance, error) {
    super(
      `There was an error initializing a DOMNodeReference for target: ${instance.target}, :: ${error}`
    );
    this.name = "DOMNodeInitializationError";
  }
}

export class DOMNodeNotFoundError extends Error {
  constructor(instance) {
    super(`The targeted DOM element was not found: ${instance.target}`);
  }
}

export class ConditionalRenderingError extends Error {
  constructor(instance, error) {
    super(
      `There was an error condiguring conditional rendering for target: ${instance.target} :: ${error}`
    );
  }
}
