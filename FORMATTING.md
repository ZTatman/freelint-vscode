# Code Formatting with Prettier

This project uses [Prettier](https://prettier.io/) for code formatting to ensure consistent style across the codebase.

## Setup

The project is already configured with:
- Prettier for code formatting
- ESLint integration with Prettier
- NPM scripts for formatting

## VS Code Configuration

To get the best experience with VS Code, configure your editor with these settings:

1. Install the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) for VS Code
2. Configure VS Code to use Prettier as the default formatter and format on save:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "prettier.requireConfig": true
}
```

You can add these settings to your user settings or workspace settings.

## Available Scripts

The following npm scripts are available for formatting:

- `npm run format` - Format all TypeScript/JavaScript files using Prettier
- `npm run format:check` - Check if files are formatted according to Prettier rules
- `npm run lint:fix` - Run ESLint with automatic fixes

## Prettier Configuration

The Prettier configuration is defined in `.prettierrc` with the following settings:

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "quoteProps": "as-needed",
  "jsxSingleQuote": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

## Pre-commit Hooks (Future Enhancement)

In the future, we may add pre-commit hooks using Husky and lint-staged to automatically format code before committing.
