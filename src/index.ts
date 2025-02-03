/// <reference path="./globals.d.ts" />
import { createDocument } from "./dom-shim.ts";
const resolvedDocument = createDocument();

import API from "./core/API.ts";
import createRef from "./core/createDOMNodeReferences.ts";
import waitFor from "./core/waitFor.ts";
import bindForm from "./core/bindForm.ts";
export { API, bindForm, createRef, waitFor };
