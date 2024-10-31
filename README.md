# PowerPages Tool Kit

This package provides utilities for managing and interacting with the DOM and making AJAX requests to a DataVerse API. It includes the `API` module for handling CRUD operations and the `DOMNodeReference` class for seamless DOM manipulations.

## Installation

After installing

`npm install powerpagestoolkit`

You can then import into your JavaScript files as follows:

```javascript
import {
  API,
  createDOMNodeReference,
  createMultipleDOMNodeReferences,
} from "powerpagestoolkit";
```

# Modules

## `DOMNodereference`

The `DOMNodeReference` module simplifies DOM element management. It provides functionalities for creating and interacting with DOM elements:

### Usage

- **`createDOMNodeReference(selector)`**: Creates a `DOMNodeReference` instance for a single DOM element specified by a CSS selector or HTMLElement. Returns a `DOMNodeReference` instance.

- **`createMultipleDOMNodeReferences(selector)`**: Creates multiple `DOMNodeReference` instances for all elements matching the specified CSS selector. Returns an array of `DOMNodeReference` instances.

```javascript
// single instance of DOMNodeReference
const node = await createDOMNodeReference("#my-element");

node.onceLoaded(() => {
  console.log("Element is loaded: ", node.element);
});

// to imitate 'querySelectorAll', and return an array of DOMNodeReferences
const nodeArray = await createMultipleDOMNodeReferences('div[class="row"]');

nodeArray.forEach((node) => {
    node.oneLoaded(() => {
        console.log("Element loaded: ", node.element")
    })
})
```

##### Properties

```typescript
target: string;
element: HTMLElement | null;
isLoaded: boolean;
visibilityController: HTMLElement | null;
defaultDisplay: string;
value: string | null;
```

##### Methods

Here are the key methods you can use with a DOMNodeReference instance:

```typescript

// Hides the associated DOM element.
hide()

// Shows the associated DOM element.
show()

// Sets the value of the associated HTML element.
setValue(value: string)

// Appends child elements to the associated HTML element.
append(...elements: HTMLElement[])

// Inserts elements after the associated HTML element.
after(...elements: HTMLElement[])

// Retrieves the label associated with the HTML element.
getLabel(): HTMLElement | null

// Appends child elements to the label associated with the HTML element.
appendToLabel(...elements: HTMLElement[])

// Adds a click event listener to the associated HTML element.
addClickListener(eventHandler: () => void)

// Adds a change event listener to the associated HTML element.
addChangeListener(eventHandler: () => void)

// Unchecks both yes and no radio buttons if they exist.
uncheckRadios()

//Creates a validation instance for the field.
createValidation(evaluationFunction: () => boolean, fieldDisplayName: string)

// Adds a tooltip to the label associated with the HTML element.
addLabelTooltip(text: string)

// Adds a tooltip to the associated HTML element.

addToolTip(text: string)

// Sets the inner HTML content of the associated HTML element.
setTextContent(text: string)

// Toggles visibility based on the provided boolean value.
toggleVisibility(shouldShow: boolean)

// Sets the visibility of the element based on a condition and binds it to another DOMNodeReference.
configureConditionalRendering(condition: () => boolean, triggerNode?: DOMNodeReference)

// Executes a callback function once the element is fully loaded.
onceLoaded(callback: (instance: DOMNodeReference) => void)

```

## `API`

The `API` module provides functions for creating and retrieving records from a DataVerse. It includes the following methods:

- **`createRecord(schema)`**: Creates a new record in the DataVerse using the provided schema instance. Returns a Promise that resolves with the record ID or rejects with an error.
- **`getRecord(tableSetName, recordID, selectColumns)`**: Retrieves a specific record from the DataVerse. Returns a Promise that resolves with the retrieved record or rejects with an error.

- **`getMultiple(tableSetName, queryParameters)`**: Retrieves multiple records from the DataVerse based on specified query parameters. Returns a Promise that resolves with the list of retrieved records or rejects with an error.

### Usage

###### 1. Creating a Record

To create a new record in the DataVerse, you can use the `createRecord` method. This method takes an instance of a schema class containing the data for the record.

```javascript
// Assuming you have a schema class defined
const schema = new YourSchemaClass({
  name: "Sample Record",
  description: "This is a sample record for demonstration.",
});

API.createRecord(schema)
  .then((recordId) => {
    console.log("Record created successfully with ID:", recordId);
  })
  .catch((error) => {
    console.error("Error creating record:", error);
  });
```

###### 2. Getting a Single Record

To retrieve a specific record from the DataVerse, use the `getRecord` method. You need to provide the table set name and the record ID.

```javascript
const tableSetName = "accounts"; // The DataVerse table set name
const recordID = "your-record-id"; // The GUID of the record to retrieve

API.getRecord(tableSetName, recordID)
  .then((record) => {
    console.log("Retrieved record:", record);
  })
  .catch((error) => {
    console.error("Error retrieving record:", error);
  });
```

###### 3. Getting Multiple Records

If you need to retrieve multiple records with specific query parameters, you can use the `getMultiple` method. This method accepts the table set name and optional query parameters for filtering.

```javascript
const tableSetName = "contacts"; // The DataVerse table set name
const queryParameters =
  "$filter=firstName eq 'John'&$select=firstName,lastName"; // OData query parameters

API.getMultiple(tableSetName, queryParameters)
  .then((records) => {
    console.log("Retrieved records:", records);
  })
  .catch((error) => {
    console.error("Error retrieving records:", error);
  });
```

##### Example Schema Class

Here's a simple example of a schema class that you might use with the createRecord method:

```javascript
class YourSchemaClass {
  constructor(tableSetName, data) {
    this.setName = tableSetName;
    this.data = data;
  }

  value() {
    return JSON.stringify(this.data); // Convert data to JSON format for the API
  }
}
```
