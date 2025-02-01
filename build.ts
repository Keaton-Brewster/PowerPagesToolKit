///<reference lib="deno.ns"/>

import * as esbuild from "esbuild";
import cssModulesPlugin from "esbuild-css-modules-plugin";
import process from "node:process";

console.log("Bundling JSR module...");

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
    outExtension: { ".js": ".js" }, // Critical for Deno imports
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
    ],
    tsconfig: "./tsconfig.json",
    packages: "external",
    legalComments: "linked", // Required for JSR compliance
    sourcemap: "linked",
    metafile: true,
    minify: process.env.NODE_ENV === "production",
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

      // Update both ESM and CJS bundles
      const updateBundles = ["index.js"].map(async (file) => {
        const bundlePath = `./dist/src/${file}`;
        const originalContent = await Deno.readTextFile(bundlePath);
        await Deno.writeTextFile(
          bundlePath,
          `${originalContent}\n${cssInjectionCode}`
        );
      });

      await Promise.all(updateBundles);
      console.log("CSS injected successfully across all bundles!");

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
          2
        )
      );
    } catch (error) {
      console.error("Build error:", error);
      Deno.exit(1);
    }
  })
  .finally(() => {
    console.log("JSR module bundling complete");
  });
