# Freelint VS Code Extension

Freelint provides ESLint functionality within VS Code without requiring local installation of ESLint and its plugins. This extension is particularly useful for remote SSH environments, where installing and configuring ESLint locally might be challenging.

## Features

- Built-in ESLint that works without local ESLint installation
- Supports JavaScript, React, JSX, and TypeScript files
- Automatically lints files on save
- Shows linting errors and warnings in VS Code Problems panel
- Bundled with popular ESLint plugins:
  - TypeScript support (`@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin`)
  - React and React Hooks (`eslint-plugin-react` and `eslint-plugin-react-hooks`)
  - Import validation (`eslint-plugin-import`)
  - Prettier integration (`eslint-plugin-prettier` and `prettier`)

## Commands

The extension provides the following commands:

- **Lint Current File with FreeLint** (`freelint.lintFile`): Manually lint the currently open file

You can access this command through the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS) by typing "Lint Current File with FreeLint".

## Configuration

Freelint can be configured through VS Code settings:

```json
{
  "freelint.enabledPlugins": ["react", "react-hooks", "import", "prettier"]
}
```

### Available Plugins

The following plugins can be enabled or disabled through the `freelint.enabledPlugins` setting:

- `react` - Enables React-specific rules (from eslint-plugin-react)
- `react-hooks` - Enables rules for React Hooks (from eslint-plugin-react-hooks)
- `import` - Enables rules for import/export syntax (from eslint-plugin-import)
- `prettier` - Enables integration with Prettier formatter (from eslint-plugin-prettier)

By default, only the `react` and `react-hooks` plugins are enabled.

You can customize these settings in your VS Code settings.json file or through the Settings UI:

1. Go to File > Preferences > Settings
2. Search for "freelint"
3. Edit the "Freelint: Enabled Plugins" setting

## Installation

1. Download the `.vsix` file from the releases
2. Open VS Code
3. Go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X` on macOS)
4. Click on the "..." menu in the top-right of the Extensions view
5. Select "Install from VSIX..." and choose the downloaded file

Alternatively, you can install it using the command line:
