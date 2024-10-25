/* eslint-disable */
const path = require("path");

module.exports = {
  // Define multiple entry points
  entry: {
    investorDetails: "./JavaScript/Investor/InvestorDetails.basicform.js",
  },
  output: {
    // Set the output filename pattern and location
    filename: "[name].bundle.js", // [name] will be replaced by entry key
    path: path.resolve(__dirname, "./dist"), // Output directory
  },
  mode: "production", // Set the build mode
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
    ],
  },
};
