import type PowerPagesElement from "../core/PowerPagesElement.ts";

export class DOMNodeInitializationError extends Error {
  constructor(instance: PowerPagesElement, error: string) {
    super(
      `There was an error initializing a PowerPagesElement for target: ${instance.target}, :: ${error}`
    );
    this.name = "DOMNodeInitializationError";
  }
}

export class DOMNodeNotFoundError extends Error {
  constructor(instance: PowerPagesElement) {
    super(`The targeted DOM element was not found: ${instance.target}`);
  }
}

export class ConditionalRenderingError extends Error {
  constructor(instance: PowerPagesElement, error: string) {
    super(
      `There was an error condiguring conditional rendering for target: ${instance.target} :: ${error}`
    );
  }
}

export class ValidationConfigError extends Error {
  constructor(node: PowerPagesElement, message: string) {
    super(`Validation configuration error for ${node.target}: ${message}`);
    this.name = "ValidationConfigError";
  }
}
