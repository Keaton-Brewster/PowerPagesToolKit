/// <reference path="../@types/index.d.ts" />
import "./style.css";

import API from "./API.js";
import createRef from "./createDOMNodeReferences.js";
import waitFor from "./waitFor.js";
import bindForm from "./bindForm.js";
export { API, createRef, waitFor, bindForm };

const toolkit = { API, createRef, waitFor, bindForm };
export default toolkit;
