import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { globby } from "globby";
import { updateImports } from "../import-update.ts";

async function generateTypeDefinitions() {
  const ROOT_DIR = path.join(process.cwd(), "src");
  const OUTPUT_FILE = path.join(process.cwd(), "index.d.ts");
  const IGNORE_PATTERNS = ["**/node_modules/**", "**/dist/**"];

  // Find all .d.ts files recursively
  const files = await globby(
    ["**/*.d.ts", ...IGNORE_PATTERNS.map((pattern) => `!${pattern}`)],
    {
      cwd: ROOT_DIR,
    }
  );

  // Generate export statements
  const exports = await Promise.all(
    files.map(async (filePath: string) => {
      const fullPath = path.join(ROOT_DIR, filePath);
      const content = await fs.promises.readFile(fullPath, "utf-8");

      // Skip files without exports
      if (!/(export|declare)/.test(content)) return null;

      const relativePath =
        "./src/" + filePath.replace(/\.d\.ts$/, "").replace(/\\/g, "/");

      const filename = path.basename(relativePath, path.extname(relativePath));

      return `export { default as ${filename} } from "${relativePath}.d.ts";`;
    })
  );

  // Filter out null entries and join with newlines
  const exportStatements = exports.filter(Boolean).join("\n");

  // Create header comment
  const header = `// AUTO-GENERATED TYPE DEFINITIONS\n// DO NOT EDIT MANUALLY\n\n`;

  // Write to index.d.ts
  await fs.promises.writeFile(
    OUTPUT_FILE,
    `${header}${exportStatements}`,
    "utf-8"
  );

  console.log(`Generated type definitions with ${exports.length} exports`);

  moveGlobals();

  updateImports("./src");
}

generateTypeDefinitions().catch(console.error);

const moveGlobals = () => {
  fs.copyFile("../src/@types/globals.d.ts", "./src/globals.d.ts", () => {
    console.log("✅ Copied globals.d.ts to ./src/globals.d.ts");
  });
};
