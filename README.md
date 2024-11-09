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

### `DOMNodereference`

The `DOMNodeReference` module simplifies DOM element management. It provides functionalities for creating and interacting with DOM elements:

#### Usage

- **`createDOMNodeReference(selector)`**: Creates a `DOMNodeReference` instance for a single DOM element specified by a CSS selector or HTMLElement. Returns a `DOMNodeReference` instance.

- **`createMultipleDOMNodeReferences(selector)`**: Creates multiple `DOMNodeReference` instances for all elements matching the specified CSS selector. Returns an array of `DOMNodeReference` instances.

`selector` uses standard ED6 `document.querySelector()` syntax. For more information, read [here](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)

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

##### Available Properties

These properties are public and can be used in any custom logic/configurations

```typescript
target: HTMLElement | string;
element: HTMLElement;
isLoaded: boolean;
value: any;
/**
 * If the element targeted is the main input for a yes/no radio control,
 * yesRadio and noRadio will be available as properties of 'this'
 */
yesRadio: DOMNodeReference;
noRadio: DOMNodeReference;
// and if 'this' is the instance of a yesRadio or noRadio
// checked will represent wether the radio has been checked or not
checked: boolean
```

##### Methods

Here are the key methods you can use with a DOMNodeReference instance:

```javascript

/********/
// VISIBILITY / ACCESSIBILITY

// Hides the associated DOM element.
hide()

// Shows the associated DOM element.
show()

/**
 * advanced visibility control in the case you need to apply
 * custom logic to the visibility of an element
 */
toggleVisibility(shouldShow: boolean | () => boolean)

/**
  * Configures conditional rendering for the target element
  * based on a condition and the visibility of one or more trigger elements.
  *
  * @param {(this: DOMNodeReference) => boolean} condition -
  * A function that returns a boolean to determine the visibility
  * of the target element. If `condition()` returns true, the
  * element is shown; otherwise, it is hidden.
  * @param {Array<DOMNodeReference>} dependencies - An array
  * of `DOMNodeReference` instances. Event listeners are
  * registered on each to toggle the visibility of the
  * target element based on the `condition` and the
  *  visibility of the target node.
  */
configureConditionalRendering(
  condition: (this: DOMNodeReference) => boolean,
  dependencies: Array<DOMNodeReference>
  )


    // EXAMPLE:
    const your_node = await createDOMNodeReference("#element_id")
    const other_node = await createDOMNodeReference(".element_class")

    your_node.configureConditionalRendering(() =>
        other_node.value == "3",
        /* your_node will only be
        visible when the value of other_node is "3"
        */
        [other_node]
        /* and we have to include any DOMNodeReferences used
        in the evaluation logic, so that changes to them can
        be watched and the condition evaluated again
        */
      );


/**
 * Sets up validation and requirement rules for the field.
 * This function dynamically updates the field's required status
 * and validates its input based on the specified conditions.
 *
 * @param {function(this: DOMNodeReference): boolean} isRequired
 * A function that determines whether the field should be required.
 * Return `true` if required, `false` to not be required.
 * @param {function(this: DOMNodeReference): boolean} isValid
 * A function that checks if the field's input is valid.
 * Return `true` if validation satisfied, `false` if not.
 * @param {string} fieldDisplayName - The name of the field, used
 * in error messages if validation fails.
 * @param {Array<DOMNodeReference>} [dependencies]
 * Other fields that this field’s requirement depends on. When
 * these Nodes or their values change, the required status
 * of this field is re-evaluated. Make sure any DOMNodeReference
 * used in `isRequired` or `isValid` is included in this array.
 */
configureValidationAndRequirements(
  isRequired: (this: this) => boolean,
  isValid: (this: this) => boolean,
  fieldDisplayName: string,
  dependencies: Array<DOMNodeReference>
)

    // EXAMPLE:
    const your_node = await createDOMNodeReference("#element_id")
    const other_node = await createDOMNodeReference(".element_class")

    your_node.configureValidationAndRequirements(
        () => other_node.yesRadio.checked,
        /* if 'yes' is checked for this other node,
          this function will evaluate to true,
          meaning that 'your_node' will be required */

        function () {
          /* important to use standard 'function' declaration,
            instead of arrow function when needing to
            access 'this' (the instance of 'your_node') */

          if (other_node.yesRadio.checked) {
            // when other_node radio is checked 'yes'
            return this.value; // this is only 'valid' if it has a value
          } else return true;
        },
        "Your Field Name",
        [other_node]
        /* since our conditions depend on
          'other_node' it must be included in the dependency
          array so that the requirement conditions can be
          re-evaluated when the value of 'other_node' changes */
      );


/* sets the elements 'disabled' to true - useful for inputs
that need to be enabled/disabled conditionally */
disable()

// Sets the element 'disabled' to false
enable()
```

```javascript
// OTHER METHODS

// Sets the value of the associated HTML element.
setValue(value: any)

// Sets the inner HTML content of the associated HTML element.
setTextContent(text: string)

// Appends child elements to the associated HTML element.
append(...elements: HTMLElement[])

// Inserts elements after the associated HTML element.
after(...elements: HTMLElement[])

// Retrieves the label associated with the HTML element.
getLabel(): HTMLElement | null

// Appends child elements to the label associated with the HTML element.
appendToLabel(...elements: HTMLElement[])

// Create an event listener on the target element. Provide access to 'this'
// in the event handler function
on(eventType: string, eventHandler: (this: DOMNodeReference) => void)

// Unchecks both yes and no radio buttons if they exist.
uncheckRadios()

// Adds a tooltip to the label associated with the HTML element.
addLabelTooltip(text: string)

// Adds a tooltip with the specified text to the element
addTooltip(text: string)

// Executes a callback function once the element is fully loaded.
onceLoaded(callback: (instance: DOMNodeReference) => void)

```

### `API`

The `API` module provides functions for creating and retrieving records from a DataVerse. It includes the following methods:

- **`createRecord(schema)`**: Creates a new record in the DataVerse using the provided schema instance. Returns a Promise that resolves with the record ID or rejects with an error.
- **`getRecord(tableSetName, recordID, selectColumns)`**: Retrieves a specific record from the DataVerse. Returns a Promise that resolves with the retrieved record or rejects with an error.

- **`getMultiple(tableSetName, queryParameters)`**: Retrieves multiple records from the DataVerse based on specified query parameters. Returns a Promise that resolves with the list of retrieved records or rejects with an error.

#### Usage

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
