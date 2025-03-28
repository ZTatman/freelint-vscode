# FreeLint

FreeLint is a Visual Studio Code extension that provides ESLint functionality without requiring local installation. It embeds ESLint and common plugins directly in the extension, allowing you to lint your JavaScript, JSX, TypeScript, and TSX files effortlessly, regardless of your project's setup.

## Features

- **Zero Configuration**: Works out of the box with sensible defaults
- **Real-time Linting**: Automatically lints your files when you open or save them
- **React Support**: Built-in linting for React and React Hooks
- **Immediate Feedback**: Shows linting errors and warnings directly in your editor
- **Cross-platform**: Works on Windows, macOS, and Linux

## Getting Started

1. Install the FreeLint extension from the Visual Studio Code Marketplace
2. Open a JavaScript or React project
3. Start coding - FreeLint will automatically lint your JS/TS files

## Commands

FreeLint provides the following commands (accessible via the Command Palette - `Ctrl+Shift+P` or `Cmd+Shift+P`):

- **Lint Current File with FreeLint**: Manually trigger linting for the current file
- **FreeLint: Debug Log Current File**: Show detailed linting information for debugging purposes
- **FreeLint: Create Test JSX File**: Create a sample JSX file with common linting issues for testing

## Default Rules

FreeLint comes with a predefined set of rules optimized for modern JavaScript and React development, including:

- React and React Hooks best practices
- Consistent code style (semicolons, quotes)
- Console usage warnings
- Unused variable detection
- And more!

## Extension Settings

This extension contributes the following settings:

- `freelint.enabledPlugins`: Enable or disable specific ESLint plugins (default: ["react", "react-hooks"])

## Installation

You can install this extension through the VS Code Marketplace:

1. Open VS Code
2. Go to Extensions view (Ctrl+Shift+X or Cmd+Shift+X on macOS)
3. Search for "FreeLint"
4. Click Install

Alternatively, you can download the VSIX file from the releases page and install it manually:

```
code --install-extension freelint-0.0.2.vsix
```

## Troubleshooting

If you encounter any issues with FreeLint:

1. Try the "FreeLint: Debug Log Current File" command to see detailed linting information
2. Check the "FreeLint" output channel in the Output panel for error messages
3. If issues persist, please file a bug report on our GitHub repository

## Release Notes

See the [CHANGELOG.md](CHANGELOG.md) for details about each release.

## License

This extension is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
