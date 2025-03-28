const path = require("path");

module.exports = {
  target: "node",
  mode: "none",
  entry: "./src/extension.ts", // Your TypeScript entry file
  output: {
    path: path.resolve(__dirname, "dist"), // Output directory for bundled files
    filename: "extension.js", // Output file
    libraryTarget: "commonjs2", // Ensure CommonJS module format for VSCode
  },
  externals: {
    vscode: "commonjs vscode"
  },
  resolve: {
    extensions: [".ts", ".js"], // Resolve TypeScript and JavaScript files
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader"
          }
        ]
      }
    ]
  },
  devtool: "nosources-source-map"
};
