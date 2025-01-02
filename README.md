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

# Core Modules

### DOMNodeReference

A powerful class for managing DOM elements with automatic value synchronization and event handling.

#### Basic Usage

DOMNodeReferences are instantiated with the help of the following factory function

```typescript
createRef(
  target: HTMLElement | string, /* You can target an HTMLElement directly,
  or use standard querySelector syntax */
  multiple: (() => boolean) | boolean = false /* are you targeting a single
  element, or multiple? true = multiple. Default is false (single) */
): Promise<DOMNodeReference | DOMNodeReferenceArray>;
```

Import the utility function for creating DOMNodeReference(s)

```typescript
import { createRef } from "powerpagestoolkit";
```

Instantiate one, or multiple instances of a DOMNodeReference

```typescript
// Create a single reference
const node = await createRef("#myElement", false);

// Create multiple references
const nodes = await createRef(".my-class", true);
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
// uses standard eventListener API, and so supports all DOM events
node.on("change", function (e) {
  console.log("Current value:", this.value);
});

node.on("click", function (e) {
  console.log(this, " has been clicked");
});

...
```

##### Visibility Control

```typescript
// Basic visibility
node.hide();
node.show();
```

**_Advanced conditional rendering_**

Out of the box, Microsoft does not provide PowerPages developers the ability to hide or show fields or form elements based on the value of another field. This method allows such configurations

_Method signature:_

```typescript
configureConditionalRendering(
    condition: () => boolean,
    dependencies?: Array<DOMNodeReference>,
    clearValuesOnHide: boolean = true
  ): DOMNodeReference /* Instance of this returned
  for optional method chaining */
```

_Example implementation:_

```typescript
node.configureConditionalRendering(
  function () // Function to evaluate wether this node should be visible or not
  {
    return otherNode.value === "some value";
  },
  [otherNode] /* Dependency array | if the values or visibility of these
  change, the function is re-evaluated */,

  true /* should the values in the targeted elements (this.element)
  be cleared if this node is hidden? Default = true */
);
```

##### Validation and Requirements

This utility enhances PowerPages forms by adding dynamic field validation and conditional requirements based on other field values.

_Method signature:_

```typescript
configureValidationAndRequirements(
  isRequired: () => boolean,
  isValid: () => boolean,
  fieldDisplayName: string,
  dependencies: DOMNodeReference[]
): DOMNodeReference; /* instance of this is returned for optional
 method chaining */
```

_Example implementation:_

```typescript
node.configureValidationAndRequirements(
  // Make field required only when "Yes" is checked
  () => dependentNode.yesRadio?.checked ?? false,

  // Basic validation: ensure field isn't empty
  function () {
    return this.value != null && this.value !== "";
  },

  "Contact Phone", // Shows in error message: "Contact Phone is required"

  [dependentNode] // Revalidate when dependentNode changes
);
```

##### Element Manipulation

```typescript
/****/ Value management /****/

// set a static value
node.setValue("new value");

// or set a value by using some sort of logic
node.setValue(() => {
  if (true) {
    return "value";
  } else return "default";
});

// Sync with DOM
node.updateValue();

// Clear the value for both the instance and the target element
node.clearValue()

/****/ Content manipulation /****/

node.setInnerHTML("<span>New content</span>");
node.append(childElement);
node.prepend(headerElement);
node.after(siblingElement);
node.before(labelElement);

/****/ Styling /****/

node.setStyle({
  display: "block",
  color: "red",
});

/****/ State management /****/

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

_Example:_

```typescript
import { createRef } from "powerpagestoolkit";

const title = await createRef("h1");

title.setInnerHTML("Hello World");
title.addTooltip("This is an Example of a tooltip!", { color: "red" });
```

![Example](./assets//infoIconExample.gif)


### DataVerse API

Perform secure API calls to DataVerse from your PowerPages site. This method implements the shell deferred token to send requests with `__RequestVerificationToken`

#### Create Records

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
const node = await createRef("#element");
```

2. Include all referenced nodes in dependency arrays:

```typescript
node.configureConditionalRendering(
  () => dependentNode.value === "test",
  [dependentNode] // Required!
);
```

3. Use TypeScript for better type safety and IntelliSense support.

4. Use proper error handling with API operations:

```typescript
/* optionally await */ API.createRecord(/*...*/)
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

## Funding

If you like this project, found it useful, or would like to help support the long-term support of this package, please feel free to contribute via GitHub Sponsors: [Keaton-Brewster](https://github.com/sponsors/Keaton-Brewster)
