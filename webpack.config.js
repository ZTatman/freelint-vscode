const path = require('path');

module.exports = {
  target: 'node',
  mode: 'none',
  entry: './src/extension.ts', // Your TypeScript entry file
  output: {
    path: path.resolve(__dirname, 'dist'), // Output directory for bundled files
    filename: 'extension.js', // Output file
    libraryTarget: 'commonjs2', // Ensure CommonJS module format for VSCode
  },
  externals: {
    vscode: 'commonjs vscode', // Only keep vscode as external
  },
  resolve: {
    extensions: ['.ts', '.js'], // Resolve TypeScript and JavaScript files
    fallback: {
      path: require.resolve('path-browserify'),
      fs: false,
    },
    mainFields: ['main', 'module'],
    alias: {
      '@babel/preset-react': path.resolve(__dirname, 'node_modules/@babel/preset-react'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  devtool: 'nosources-source-map',
};
