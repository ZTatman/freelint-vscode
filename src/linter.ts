import * as vscode from "vscode";
import { ESLint } from "eslint";
import * as path from "path";
import { logger } from "./logger";

/**
 * Linter class to handle ESLint integration and diagnostics.
 */
export class Linter {
  private eslint: ESLint;
  private diagnosticCollection: vscode.DiagnosticCollection;
  private enabled: boolean = true;

  constructor(extensionPath: string) {
    // Get the configured React version from settings
    const reactVersion = vscode.workspace.getConfiguration("freelint").get("reactVersion", "18.2.0");
    logger.info(`Using React version ${reactVersion} for linting rules`);

    // Initialize ESLint with a basic configuration
    try {
      this.eslint = new ESLint({
        cwd: extensionPath,
        useEslintrc: false,
        baseConfig: {
          plugins: ["react", "react-hooks", "import"],
          extends: [
            "eslint:recommended",
            "plugin:react/recommended",
            "plugin:import/recommended",
          ],
          env: {
            browser: true,
            es2021: true,
            node: true,
          },
          parserOptions: {
            ecmaVersion: 2021,
            sourceType: "module",
            ecmaFeatures: {
              jsx: true,
            },
          },
          rules: {
            "react/react-in-jsx-scope": "off",
            // General rules
            // Most of these rules are already included in eslint:recommended
            // Only include rules that differ from defaults or need specific configuration
            "no-console": "warn",
            // React rules
            "react/jsx-pascal-case": "error",
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
            // Import rules
            "import/no-unresolved": "error",
            "import/named": "error",
            "import/default": "error",
            "import/namespace": "error",
            "import/no-absolute-path": "error",
          },
          settings: {
            react: {
              version: reactVersion, // Use the configured version
            },
          },
        },
      } as any);

      logger.info("ESLint instance successfully created");
    } catch (err) {
      logger.error(`Failed to create ESLint instance: ${err}`, true);
      throw err;
    }

    // Create diagnostic collection
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection("freelint");
  }

  /**
   * Gets the ESLint version.
   */
  public getEslintVersion(): string {
    return ESLint.version;
  }

  /**
   * Gets the diagnostic collection.
   */
  public getDiagnosticCollection(): vscode.DiagnosticCollection {
    return this.diagnosticCollection;
  }

  /**
   * Lint a document for ESLint issues.
   * @param document The document to lint
   */
  public async lintDocument(document: vscode.TextDocument): Promise<void> {
    try {
      // Skip linting if disabled
      if (!this.enabled) {
        return;
      }

      // Only lint JavaScript/JSX files
      const validExtensions = [".js", ".jsx", ".ts", ".tsx"];
      const fileExtension = path.extname(document.fileName);

      if (!validExtensions.includes(fileExtension)) {
        return;
      }

      // Skip if the document's scheme is not file
      if (document.uri.scheme !== "file") {
        return;
      }

      const text = document.getText();

      try {
        const results = await this.eslint.lintText(text, {
          filePath: document.uri.fsPath,
          warnIgnored: true,
        });

        const diagnostics: vscode.Diagnostic[] = [];
        let errorCount = 0;
        let warningCount = 0;

        for (const result of results) {
          for (const message of result.messages) {
            // Skip messages without line information (can't create range)
            if (!message.line) {
              continue;
            }

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
              diagnostic.source = `freelint(${message.ruleId})`;
            }

            if (message.severity === 2) {
              errorCount++;
            } else {
              warningCount++;
            }

            diagnostics.push(diagnostic);
          }
        }

        this.diagnosticCollection.set(document.uri, diagnostics);

        // Log summary of results if there are any issues
        if (diagnostics.length > 0) {
          const fileName = path.basename(document.fileName);
          logger.logLintResults(fileName, errorCount, warningCount);
        }
      } catch (eslintError) {
        logger.error(
          `ESLint error while linting ${document.fileName}: ${eslintError}`
        );
        vscode.window.showErrorMessage(`Linting failed: ${eslintError}`);
      }
    } catch (error) {
      logger.error(`Unexpected error in lintDocument: ${error}`);
      vscode.window.showErrorMessage(`Linting failed: ${error}`);
    }
  }

  /**
   * Dispose the diagnostic collection.
   */
  public dispose(): void {
    this.diagnosticCollection.dispose();
  }

  /**
   * Toggle the linter on or off
   * @returns The new state (true = enabled, false = disabled)
   */
  public toggle(): boolean {
    this.enabled = !this.enabled;

    if (!this.enabled) {
      // Clear all diagnostics when disabled
      this.diagnosticCollection.clear();
    }

    return this.enabled;
  }

  /**
   * Check if the linter is currently enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }
}

// Export a function to create a new linter
export function createLinter(extensionPath: string): Linter {
  return new Linter(extensionPath);
}
