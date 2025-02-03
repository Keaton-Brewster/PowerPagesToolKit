import { parseHTML } from "linkedom";

// Cross-platform document factory
export function createDocument(html = "") {
  if (typeof document !== "undefined") {
    // Browser environment
    return document;
  }

  // Server/Deno environment
  try {
    return parseHTML(html).document;
  } catch (e) {
    throw new Error("DOM polyfill failed. Ensure linkedom is imported.");
  }
}

// Optional: Global override (use cautiously)
if (typeof document === "undefined") {
  (globalThis as any).document = createDocument();
}
