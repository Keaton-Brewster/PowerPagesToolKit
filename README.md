# PowerPages Tool Kit

A TypeScript/JavaScript utility package for seamless DOM manipulation and DataVerse API interactions in PowerPages applications. This toolkit provides robust DOM element management and standardized DataVerse CRUD operations with full TypeScript support.

## Features

- Powerful DOM element manipulation and reference management
- Type-safe DataVerse API operations
- Automatic value synchronization for form elements
- Advanced conditional rendering and validation
- Radio button and checkbox handling
- Event management with proper TypeScript typing
- Mutation observer integration for dynamic content
- Tooltip and label management utilities

## Installation

```bash
npm install powerpagestoolkit
```

## Core Modules

### DOMNodeReference

A powerful class for managing DOM elements with automatic value synchronization and event handling.

#### Basic Usage

```typescript
import {
  createDOMNodeReference,
  createMultipleDOMNodeReferences,
} from "powerpagestoolkit";

// Both methods support standard querySelector syntax:

// Create a single reference
const node = await createDOMNodeReference("#myElement");

// Create multiple references
const nodes = await createMultipleDOMNodeReferences(".my-class");
```

#### Properties

| Property | Type                     | Description                                   |
| -------- | ------------------------ | --------------------------------------------- |
| element  | HTMLElement              | The referenced DOM element                    |
| value    | any                      | Current synchronized value of the element     |
| isLoaded | boolean                  | Element load status                           |
| target   | HTMLElement \| string    | Original target selector or element           |
| yesRadio | DOMNodeReference \| null | Reference to 'yes' radio (for boolean fields) |
| noRadio  | DOMNodeReference \| null | Reference to 'no' radio (for boolean fields)  |
| checked  | boolean                  | Checkbox/radio checked state                  |

#### Key Methods

##### Event Handling

```typescript
// Add event listener with proper 'this' context
node.on("change", function (e) {
  console.log("Current value:", this.value);
});

// Wait for element to be loaded
node.onceLoaded((instance) => {
  console.log("Element ready:", instance.element);
});
```

##### Visibility Control

```typescript
// Basic visibility
node.hide();
node.show();

// Advanced conditional rendering
node.configureConditionalRendering(
  // Function to evaluate wether this node should be visible or not
  function () {
    return otherNode.value === "expected";
  },
  [otherNode] // Dependency array | if the values or visibility of these change, the function is re-evaluated
);
```

##### Validation and Requirements

```typescript
node.configureValidationAndRequirements(
  // Function to evaluate if this field should be required
  function () {
    return dependentNode.yesRadio?.checked ?? false;
  },
  // Function to evaluate if the data in this field is valid
  function () {
    return this.value != null && this.value !== "";
  },
  "Field Display Name", // the name that will be displayed along side a validation failure message
  [dependentNode] // Dependency array | if the requirement level of these change, this element is re-evaluated
);
```

##### Element Manipulation

```typescript
// Value management
node.setValue("new value"); // set a static value
// or set a value by using some sort of logic
node.setValue(() => {
  if (true) {
    return "value";
  } else return "default";
});
node.updateValue(); // Sync with DOM

// Content manipulation
node.setInnerHTML("<span>New content</span>");
node.append(childElement);
node.prepend(headerElement);
node.after(siblingElement);
node.before(labelElement);

// Styling
node.setStyle({
  display: "block",
  color: "red",
});

// State management
node.disable();
node.enable();
```

##### Label and Tooltip Management

```typescript
// LABEL AND INFO OPERATIONS
const label = node.getLabel();
// appends a tooltip to the label associated with the element targeted by 'this'
node.addLabelTooltip(
  "Helper text",
  /* Optionally pass in css styles to customize the tooltip icon*/
  { color: "orange", fontSize: "30px" }
);
// appends a tooltip directly to the element targeted by 'this'
node.addTooltip(
  "Inline helper",
  /* Optionally pass in css styles to customize the tooltip icon*/
  { color: "orange", fontSize: "30px" }
);
```

### DataVerse API

Type-safe wrapper for DataVerse API operations.

#### Create Record

```typescript
await API.createRecord("accounts", {
  name: "Gypsum LLC",
  type: "Vendor",
})
  .then((recordId) => {
    console.log("Created record:", recordId);
  })
  .catch((error) => {
    console.error("Creation failed:", error);
  });
```

#### Get Records

```typescript
// Single record
const record = await API.getRecord(
  "accounts",
  "record-guid",
  "select=name,accountnumber"
);

// Multiple records
const records = await API.getMultiple(
  "contacts",
  '$filter=firstname eq "Jane"&$select=firstname,lastname'
);
```

#### Update Record

```typescript
await API.updateRecord("contacts", "record-guid", {
  name: "Jane Smith",
  email: "jane@example.com",
});
```

## Best Practices

1. Always await DOMNodeReference creation:

```typescript
const node = await createDOMNodeReference("#element");
```

2. Include all referenced nodes in dependency arrays:

```typescript
node.configureConditionalRendering(
  () => dependentNode.value === "test",
  [dependentNode] // Required!
);
```

3. Use TypeScript for better type safety and IntelliSense support.

4. Handle loading states:

```typescript
node.onceLoaded((instance) => {
  // Safe to manipulate the element here
});
```

5. Use proper error handling with API operations:

```typescript
await API.createRecord(/*...*/)
  .then((recordId) => {})
  .catch((error) => {
    // handle your errors appropriately
  });
```

## TypeScript Support

The package includes full TypeScript definitions and type safety. Use TypeScript for the best development experience and catch potential errors at compile time.

## Contributing

Contributions are welcome, feel free to create a pull request with enhancements. Please include an explanation of the changes made. All pull requests will be reviewed by the project owner.

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.
