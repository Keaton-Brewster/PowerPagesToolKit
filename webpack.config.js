import path from "path";
import { fileURLToPath } from "url"; // Only if you need __dirname in ESM
import { CleanWebpackPlugin } from "clean-webpack-plugin"; // Example plugin import
import TerserPlugin from "terser-webpack-plugin";

// Use this block if you need to recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: "./src/index.ts",
  output: {
    // Set the output filename pattern and location
    filename: "index.bundle.js", // [name] will be replaced by entry key
    path: path.resolve(__dirname, "dist"), // Output directory
    libraryTarget: "module",
  },
  mode: "production",
  optimization: {
    minimize: false,
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Transpile JavaScript files
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.css$/, // Add this rule for CSS
        use: ["style-loader", "css-loader"], // Use both loaders
      },
    ],
  },
  plugins: [new CleanWebpackPlugin()],
  experiments: {
    outputModule: true, // Required to support library.type: "module"
  },
};
