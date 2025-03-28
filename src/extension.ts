import * as vscode from "vscode";
import { ESLint } from "eslint";
import * as path from "path";
import * as fs from "fs";

let eslint: ESLint;
let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("Freelint Extension Activated!");

  // Get enabled plugins from settings
  const configuration = vscode.workspace.getConfiguration("freelint");
  const enabledPlugins = configuration.get<string[]>("enabledPlugins", [
    "react",
    "react-hooks",
  ]);

  // Build custom ESLint config based on user settings
  const eslintConfig = {
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", ...enabledPlugins],
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
  };

  // Add plugin-specific extends based on enabled plugins
  if (enabledPlugins.includes("react")) {
    eslintConfig.extends.push("plugin:react/recommended");
  }
  if (enabledPlugins.includes("react-hooks")) {
    eslintConfig.extends.push("plugin:react-hooks/recommended");
  }

  // Write the dynamic config to a temporary file
  const configPath = path.join(context.extensionPath, "dynamic-eslintrc.json");
  fs.writeFileSync(configPath, JSON.stringify(eslintConfig, null, 2));

  // Initialize ESLint with the dynamic config
  eslint = new ESLint({
    cwd: context.extensionPath,
    overrideConfigFile: configPath,
  });

  // Create diagnostic collection
  diagnosticCollection =
    vscode.languages.createDiagnosticCollection("freelint");

  // Register the lint command
  let lintCommand = vscode.commands.registerCommand(
    "freelint.lintFile",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      await lintDocument(editor.document);
    }
  );

  // Register auto-lint on save
  let saveListener = vscode.workspace.onDidSaveTextDocument(
    async (document) => {
      await lintDocument(document);
    }
  );

  // Add subscriptions
  context.subscriptions.push(lintCommand, saveListener);
}

async function lintDocument(document: vscode.TextDocument) {
  try {
    const text = document.getText();
    const results = await eslint.lintText(text, {
      filePath: document.uri.fsPath,
    });

    const diagnostics: vscode.Diagnostic[] = [];

    for (const result of results) {
      for (const message of result.messages) {
        const range = new vscode.Range(
          message.line - 1,
          message.column - 1,
          message.endLine ? message.endLine - 1 : message.line - 1,
          message.endColumn ? message.endColumn - 1 : message.column - 1
        );

        const diagnostic = new vscode.Diagnostic(
          range,
          message.message,
          message.severity === 2
            ? vscode.DiagnosticSeverity.Error
            : vscode.DiagnosticSeverity.Warning
        );

        if (message.ruleId) {
          diagnostic.source = `eslint (${message.ruleId})`;
        }

        diagnostics.push(diagnostic);
      }
    }

    diagnosticCollection.set(document.uri, diagnostics);
  } catch (error) {
    vscode.window.showErrorMessage(`Linting failed: ${error}`);
  }
}

export function deactivate() {
  if (diagnosticCollection) {
    diagnosticCollection.dispose();
  }
}
