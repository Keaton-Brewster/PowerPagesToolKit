///<reference lib="deno.ns"/>

import * as esbuild from "esbuild";
import cssModulesPlugin from "esbuild-css-modules-plugin";
import { copyFile } from "node:fs";
import { updateImports } from "./import-update.ts";

console.log("Bundling module...");

// Deno-specific build configuration
esbuild
  .build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    outdir: "./dist",
    format: "esm",
    target: "esnext",
    platform: "neutral", // Best for cross-platform compatibility
    mainFields: ["module", "main"], // Deno prioritizes module field
    conditions: ["import", "module"], // Ensures ESM resolution
    plugins: [
      cssModulesPlugin({
        inject: true, // We'll handle CSS injection separately
        localsConvention: "camelCaseOnly",
        emitDeclarationFile: false,
      }),
      {
        name: "preserve-types",
        setup(build) {
          build.onLoad({ filter: /\.ts$/ }, async (args) => {
            return {
              loader: "ts",
              contents: await Deno.readTextFile(args.path),
            };
          });
        },
      },
      {
        name: "inject-global-types",
        setup(build) {
          build.onEnd(async () => {
            await copyFile(
              "./src/@types/globals.d.ts",
              "./dist/src/globals.d.ts",
              () => {
                console.log(
                  "✅ Copied globals.d.ts to ./dist/src/globals.d.ts",
                );
              },
            );
          });
        },
      },
    ],
    loader: {
      ".ts": "ts",
    },
    tsconfig: "./tsconfig.json",
    packages: "external",
    legalComments: "linked", // Required for JSR compliance
    sourcemap: "linked",
    metafile: true,
    minify: false,
  })
  .then(async () => {
    // Handle CSS injection for browser environments
    try {
      const cssOutputPath = "./src/index.css";
      const cssContent = await Deno.readTextFile(cssOutputPath);

      // Create platform-safe CSS injection
      const cssInjectionCode = `
      if (typeof document !== 'undefined') {
        const style = document.createElement('style');
        style.textContent = ${JSON.stringify(cssContent)};
        document.head.appendChild(style);
      }
    `;
      // write import string for JSR type creation
      const importString = `/* @ts-self-types="./index.d.ts" */`;

      const bundlePath = `./dist/src/index.js`;
      const originalContent = await Deno.readTextFile(bundlePath);
      await Deno.writeTextFile(
        bundlePath,
        `${importString}\n${originalContent}\n${cssInjectionCode}`,
      );

      // update '.ts' imports in declaration files to '.d.ts'
      updateImports("./dist/src");

      // Generate JSR metadata
      await Deno.writeTextFile(
        "./dist/import_map.json",
        JSON.stringify(
          {
            imports: {
              "powerpagestoolkit/": "./",
              powerpagestoolkit: "./index.js",
            },
          },
          null,
          2,
        ),
      );
    } catch (error) {
      console.error("Error during post build", error);
      Deno.exit(1);
    }
  })
  .finally(() => {
    console.log("JSR module bundling complete");
  });
