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

DOMNodeReferences are instantiated with the help of the following factory function: `createRef`

```typescript
createRef(
  target: HTMLElement | string,
  options: {
    multiple: (() => boolean) | boolean = false,
    root: HTMLElement,
    timeoutMs:number
  }
): Promise<DOMNodeReference | DOMNodeReference[]>;
```

createRef takes two main arguments:

<table style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Property</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Type</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Details</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">target</td>
      <td style="border: 1px solid #ddd; padding: 8px;">
        <pre><code class="language-javascript">string | HTMLElement</code></pre>
      </td>
      <td style="border: 1px solid #ddd; padding: 8px;">
        Use standard <code>querySelector</code> syntax to target an element, or elements in the DOM, or pass in an instance of the element itself to create a reference.
      </td>
    </tr>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">options</td>
      <td style="border: 1px solid #ddd; padding: 8px;">
        <pre><code class="language-javascript">{
  multiple: () => boolean | boolean,
  root: HTMLElement,
  timeoutMs:number
}</code></pre>
      </td>
      <td style="border: 1px solid #ddd; padding: 8px;">
        Provides advanced configurations for niche scenarios, such as async DOM element loading, returning arrays of elements, or specifying the parent to search within for the target node.
      </td>
    </tr>
  </tbody>
</table>

Import the utility function for creating DOMNodeReference(s)

```typescript
import { createRef } from "powerpagestoolkit";
```

Instantiate one, or multiple instances of a DOMNodeReference, and optionally configure advanced options

```javascript
// Create a single reference (i.e. 'querySelector')
const node = await createRef("#myElement");

// Create multiple references (i.e. 'querySelectorAll')
const nodes = await createRef(".my-class", { multiple: true });

/******************/
// ADVANCED OPTIONS
// in the event that you need to be more granular with how you are targeting
// and retrieving elements, there are additional options

// If the node you are targeting is not available at the initial execution
// of the script, set a timeout for 2 seconds
const node2 = await createRef("#target", { timeoutMs:2000 });

// need to target a node within a specific node? use that node as the root
const otherElement = document.getElementById("id");
const node3 = await createRef("#target", { root: otherElement });

// implement all options:
const nodes2 = await createRef("#target", {
  multiple: true,
  timeoutMs:4000,
  root: otherElement,
});
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

##### Business Rule Application

This utility provides a flexible way to dynamically control field visibility, requirement status, values, and enabled states based on dependencies within PowerPages forms.

_Method Signature:_

```typescript
applyBusinessRule(
  rule: BusinessRule,
  dependencies: DOMNodeReference[]
): DOMNodeReference; /* Instance of this is returned for optional
 method chaining */
```

**BusinessRule Definition**

```typescript
interface BusinessRule {
  setVisibility?: () => boolean;
  setRequirements?: () => ({
    isRequired: () => boolean,
    isValid: () => boolean
  });
  setValue?: () => ({
    condition: () => boolean,
    value: () => any | any
  });
  setDisabled?: () => boolean;
}
```

##### Visibility Control

```typescript
// Show the 'taxIdField' only when
// 'businessTypeField' is set to 'Corporation' or 'LLC'
taxIdField.applyBusinessRule(
  {
    setVisibility: 
      () =>
        businessTypeField.value === "Corporation" ||
        businessTypeField.value === "LLC"
  },
  [businessTypeField] // Re-evaluate when businessTypeField changes
);
```

##### Validation and Requirements

```typescript
// Require 'taxIdField' when 'businessTypeField' is 'Corporation' or 'LLC'
taxIdField.applyBusinessRule(
  {
    setRequirements: () => ({
      isRequired: function () {
        return (
          businessTypeField.value === "Corporation" ||
          businessTypeField.value === "LLC"
        );
      },
      isValid: function () {
        return this.value != null && this.value !== "";
      },
    })
  },
  [businessTypeField] // Revalidate when businessTypeField changes
);
```

##### Setting Field Values Conditionally

```typescript
// Set default industry value when 'businessTypeField' is 'Corporation'
industryField.applyBusinessRule(
  {
    setValue: () => ({
      condition: () => businessTypeField.value === "Corporation",
      value: "Corporate"
    })
  },
  [businessTypeField] // Apply value when businessTypeField changes
);
```

##### Enabling and Disabling Fields

```typescript
// Disable 'taxIdField' when 'businessTypeField' is 'Individual'
taxIdField.applyBusinessRule(
  {
    setDisabled: () => businessTypeField.value === "Individual",
  },
  [businessTypeField] // Enable/disable when businessTypeField changes
);
```

##### Element Manipulation

_Value management_

```typescript
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
node.clearValue();
```

_Content manipulation_

```typescript
node.setInnerHTML("<span>New content</span>");
node.append(childElement);
node.prepend(headerElement);
node.after(siblingElement);
node.before(labelElement);
```

_Styling_

```typescript
node.setStyle({
  display: "block",
  color: "red",
});
```

_Enabling/Disabling inputs_

```typescript
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

const title = await createRef("#myTitle");

title.addTooltip("This is an Example of a tooltip!", { color: "red" });
```

![Example](./assets//infoIconExample.gif)

Here's an improved markdown documentation with more comprehensive details:

### BindForm Method

The `bindForm` method simplifies form element management in DataVerse by providing a semantic and efficient way to access form controls, sections, and tabs.

##### Key Features

- Retrieves form definition directly from DataVerse
- Automatically generates references for:
  - Controls
  - Sections
  - Tabs

##### Element Types

| Element Type | Description                                 | Accessibility             |
| ------------ | ------------------------------------------- | ------------------------- |
| `control`    | Includes all form fields and sub-grids      | Accessed via logical name |
| `section`    | Standard PowerApps form sections            | Accessed via logical name |
| `tab`        | Form tabs corresponding to PowerApps layout | Accessed via logical name |

##### Usage Example

```javascript
import { bindForm } from "powerpagestoolkit";

// Basic form binding
bindForm("form-guid").then((form) => {
  // Access elements by their logical name
  const nameField = form["name"];

  // execute custom methods
  nameField.applyBusinessRule(
    {
      setVisibility: [() => someNode.value === "desired value"],
    },
    [someNode]
  );

  // Or executes methods immediately upon accessing
  form["phonenumber"].addTooltip("Example tooltip text");
});
```

##### Method Signature

```typescript
/**
 * Binds a form by its GUID and returns a collection of form elements
 * @param formGuid Unique identifier for the form
 * @returns Promise resolving to form element references
 */
function bindForm(formGuid: string): Promise<DOMNodeReferenceArray & Record<string: DOMNodeReference>>;
```

##### Benefits

- Reduces code complexity
- Improves readability
- Provides type-safe access to form elements
- Supports flexible form interactions

##### Best Practices

- Use logical names consistently
- Handle async nature of form binding
- Leverage TypeScript for enhanced type checking

##### Error Handling

Ensure proper error handling for form binding:

```javascript
bindForm("form-guid")
  .then((form) => {
    // Form processing
  })
  .catch((error) => {
    console.error("Form binding failed", error);
  });
```

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
