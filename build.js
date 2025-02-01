import esbuild from "esbuild";
import CssModulesPlugin from "esbuild-css-modules-plugin";
import fs from "fs/promises";
import { Buffer } from "buffer";

console.log("Bundling ESM Module...");

esbuild
  .build({
    entryPoints: ["src/index.ts"],
    globalName: "powerpagestoolkit",
    outfile: "dist/bundle.js",
    format: "esm",
    tsconfig: "./tsconfig.json",
    sourcemap: false,
    bundle: true,
    platform: "browser",
    target: "esnext",
    minify: false,
    plugins: [
      CssModulesPlugin({
        force: true,
        emitDeclarationFile: false,
        namedExports: true,
      }),
      {
        name: "preserve-jsdoc",
        setup(build) {
          build.onLoad({ filter: /\.ts$/ }, async (args) => {
            const contents = await fs.readFile(args.path, "utf8");
            return { contents, loader: "ts" };
          });
        },
      },
      {
        name: "export-cleanup",
        setup(build) {
          build.onEnd((result) => {
            result.outputFiles?.forEach((file) => {
              let contents = file.text;
              // Remove duplicate export declarations
              contents = contents.replace(/export { .*? }\n/g, "");
              file.contents = Buffer.from(contents);
            });
          });
        },
      },
    ],
    loader: {
      ".ts": "ts",
      ".css": "css",
    },
  })
  .then(async () => {
    try {
      const cssOutputPath = "./dist/bundle.css";
      // Read the generated CSS file content
      const cssContent = await fs.readFile(cssOutputPath, "utf-8");

      // Create a JavaScript snippet to inject the CSS into the <head>
      const cssInjectionCode = `
          (function() {
            const style = document.createElement('style');
            style.textContent = ${JSON.stringify(cssContent)};
            document.head.appendChild(style);
          })();
        `;

      // Append the injection code to the end of the bundle.js
      const bundlePath = "./dist/bundle.js";
      const bundleContent = await fs.readFile(bundlePath, "utf-8");
      await fs.writeFile(bundlePath, `${bundleContent}\n${cssInjectionCode}`);

      console.log("CSS injected successfully!");
    } catch (error) {
      console.error("Error injecting CSS:", error);
    }
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    console.log("ESM Module bundled");
  });
