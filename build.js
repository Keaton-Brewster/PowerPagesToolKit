import esbuild from "esbuild";
import CssModulesPlugin from "esbuild-css-modules-plugin";

esbuild
  .build({
    entryPoints: ["src/index.ts"],
    outfile: "dist/bundle.js",
    format: "esm",
    tsconfig: "./tsconfig.json",
    sourcemap: true,
    bundle: true,
    platform: "browser",
    target: "esnext",
    minify: false,
    plugins: [
      CssModulesPlugin({
        force: true,
        emitDeclarationFile: true,
        localsConvention: "camelCaseOnly",
        namedExports: true,
        inject: false,
      }),
    ],
    loader: {
      ".ts": "ts",
      ".css": "css",
    },
  })
  .catch(() => process.exit(1));
