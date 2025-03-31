# FreeLint Extension for VS Code

FreeLint provides ESLint functionality without requiring local installation of ESLint in your project.

## Features

- Lint JavaScript and JSX files using ESLint
- No need to install ESLint or plugins locally in your project
- Support for React, React Hooks, and Import/Export linting rules
- Status bar indicator to toggle linting on/off
- Set the React version for React linting rules
- Includes test file generators to demonstrate linting capabilities

## Commands

The extension provides several commands:

- `FreeLint: Lint Current File` - Manually trigger linting on the current file
- `FreeLint: Toggle On/Off` - Enable or disable FreeLint
- `FreeLint: Create JavaScript Test File` - Create a JavaScript file with common linting issues
- `FreeLint: Create React Test JSX File` - Create a React JSX file with hook-related linting issues
- `FreeLint: Create Import/Export Test JSX File` - Create a file with import/export linting issues
- `FreeLint: Set React Version for Linting` - Choose which React version to use for linting rules
- `FreeLint: Debug Log Current File` - Log the current linting results to the output channel


## Extension Settings

This extension contributes the following settings:

- `freelint.enabledPlugins`: Array of ESLint plugins to enable
- `freelint.reactVersion`: React version to use for ESLint React rules

## Configuration

### React Version

You can set the React version used for linting:

1. Through settings: Set `freelint.reactVersion` in your VS Code settings
2. Using the command: Run `FreeLint: Set React Version for Linting` from the command palette

## Requirements

No additional requirements. FreeLint includes all necessary ESLint packages and plugins.

## Known Issues

- TypeScript's language server may show additional diagnostics alongside FreeLint
- Import/Export linting might have reduced capabilities compared to a locally installed ESLint

## Release Notes

See the [CHANGELOG](CHANGELOG.md) for detailed release notes.

## License

This extension is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
