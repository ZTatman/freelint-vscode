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
    // Initialize ESLint with a basic configuration
    this.eslint = new ESLint({
      cwd: extensionPath,
      useEslintrc: false,
      baseConfig: {
        plugins: ["react", "react-hooks"],
        extends: ["eslint:recommended", "plugin:react/recommended"],
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
          semi: ["error", "always"],
          "no-console": "warn",
          "no-unused-vars": "error",
          quotes: ["warn", "single", { avoidEscape: true }],
          "react/jsx-pascal-case": "error",
          "react-hooks/rules-of-hooks": "error",
          "react-hooks/exhaustive-deps": "warn",
        },
        settings: {
          react: {
            version: "detect",
          },
        },
      },
    } as any);

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
              diagnostic.source = `freelint (${message.ruleId})`;
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
   * Create a test file with various lint issues.
   * @param workspaceFolder The workspace folder to create the file in
   */
  public async createTestFile(
    workspaceFolder: vscode.WorkspaceFolder
  ): Promise<void> {
    const testFilePath = path.join(
      workspaceFolder.uri.fsPath,
      "test-eslint.jsx"
    );
    const testContent = `
import React, { useState, useEffect, useCallback } from 'react';

// Missing semicolons
var unused = "this variable is never used"
const badQuotes = "mixing quote styles"

// No-console violation
console.log("This will trigger a no-console warning");

// Extra semicolons
const extraSemi = 5;;

// Simple component with hooks violations
function HooksComponent() {
  // This is fine
  const [count, setCount] = useState(0);
  
  // Rules of hooks violation - conditional hook
  if (count > 0) {
    // Error: React Hook "useState" is called conditionally
    const [error, setError] = useState(null);
  }
  
  // Exhaustive deps warning - missing dependency
  useEffect(() => {
    // Warning: React Hook useEffect has a missing dependency: 'count'
    console.log('Count changed to', count);
    // Should include count in the dependency array
  }, []);
  
  // Conditionally defined callback - violates rules of hooks
  let handleClick;
  if (count > 10) {
    // Error: React Hook "useCallback" is called conditionally
    handleClick = useCallback(() => {
      setCount(count + 1);
    }, [count]);
  }
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

export default HooksComponent;
`;

    try {
      // Create a URI for the test file
      const uri = vscode.Uri.file(testFilePath);

      // Write the test content to the file
      await vscode.workspace.fs.writeFile(
        uri,
        Buffer.from(testContent, "utf8")
      );

      // Open the file
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document);

      // Trigger linting
      await this.lintDocument(document);

      // Show a message in the output channel
      logger.info(`Created test file: ${path.basename(testFilePath)}`, true);
      vscode.window.showInformationMessage(
        "Test file created with lint issues. Check 'FreeLint' output for details."
      );
    } catch (error) {
      logger.error(`Error creating test file: ${error}`);
      vscode.window.showErrorMessage(`Failed to create test file: ${error}`);
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
