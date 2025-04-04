import * as vscode from "vscode";
import { ESLint } from "eslint";
import * as path from "path";
import { logger } from "./logger";

/**
 * Interface for ESLint message fix
 */
interface ESLintFix {
  range: [number, number];
  text: string;
}

/**
 * Interface for ESLint message
 */
interface ESLintMessage {
  ruleId: string | null;
  severity: number;
  message: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  fix?: ESLintFix;
}

/**
 * Linter class to handle ESLint integration and diagnostics.
 */
export class Linter {
  private changeListener: vscode.Disposable | undefined;
  private codeActionProvider: vscode.Disposable | undefined;
  private debounceTimer: NodeJS.Timeout | undefined;
  private diagnosticCollection: vscode.DiagnosticCollection;
  private enabled: boolean = true;
  private eslint: ESLint;
  private extensionPath: string;

  constructor(extensionPath: string) {
    this.extensionPath = extensionPath;
    // Get the configured React version from settings
    const reactVersion = vscode.workspace.getConfiguration("freelint").get("reactVersion", "18.2.0");
    logger.info(`Using React version ${reactVersion} for linting rules`);

    // Initialize ESLint with a basic configuration
    try {
      const baseConfig = {
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
          // eslint
          "react/react-in-jsx-scope": "off",
          "no-console": "warn",
          "no-unused-vars": "warn",
          "no-redeclare": "error",
          "no-var": "warn",
          "no-unreachable": "error",
          "no-extra-semi": "warn",
          "quotes": ["warn", "single"],
          "eqeqeq": ["warn", "always"],
          "semi": ["warn", "always"],
          "no-undef": "error",
          // react
          "react/jsx-pascal-case": "error",
          "react-hooks/rules-of-hooks": "error",
          "react-hooks/exhaustive-deps": "warn",
          // import
          "import/no-unresolved": "error",
          "import/named": "error",
          "import/default": "error",
          "import/namespace": "error",
          "import/no-absolute-path": "error",
        },
        settings: {
          react: {
            version: reactVersion,
          },
        },
      };

      this.eslint = new ESLint({
        cwd: extensionPath,
        useEslintrc: false,
        baseConfig: baseConfig as any,
      } as ESLint.Options);

      logger.info("ESLint instance successfully created");
    } catch (err) {
      logger.error(`Failed to create ESLint instance: ${err}`, true);
      throw err;
    }

    // Create diagnostic collection
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection("freelint");

    // Register code action provider
    this.codeActionProvider = vscode.languages.registerCodeActionsProvider(
      [
        { scheme: 'file', language: 'javascript' },
        { scheme: 'file', language: 'javascriptreact' },
        { scheme: 'file', language: 'typescript' },
        { scheme: 'file', language: 'typescriptreact' }
      ],
      {
        provideCodeActions: this.provideCodeActions.bind(this)
      }
    );

    // Add after code action provider registration
    this.changeListener = vscode.workspace.onDidChangeTextDocument(event => {
      if (this.enabled) {
        this.debounceLint(event.document);
      }
    });
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

      // Skip if the document is the output channel
      if (document.fileName.includes('extension-output')) {
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

        // Only update diagnostics and log if there are changes
        const currentDiagnostics = this.diagnosticCollection.get(document.uri) || [];
        if (JSON.stringify(currentDiagnostics) !== JSON.stringify(diagnostics)) {
          this.diagnosticCollection.set(document.uri, diagnostics);
          if (diagnostics.length > 0) {
            const fileName = path.basename(document.fileName);
            logger.logLintResults(fileName, errorCount, warningCount);
          }
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
      if (this.codeActionProvider) {
        this.codeActionProvider.dispose();
      }
      if (this.changeListener) {
        this.changeListener.dispose();
      }
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
    }
  
    /**
     * Toggle the linter on or off
     * @returns The new state (true = enabled, false = disabled)
     */
    public toggle(): boolean {
      this.enabled = !this.enabled;
      if (!this.enabled) {
        // Clear all diagnostics and pending lint operations when disabled
        this.diagnosticCollection.clear();
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }
      }
  
      return this.enabled;
    }
  
    /**
     * Check if the linter is currently enabled
     */
    public isEnabled(): boolean {
      return this.enabled;
    }

  /**
   * Get ESLint results with auto-fix
   * @param document Document to fix
   * @returns ESLint results with fixes applied
   */
  private async getAutoFixResults(document: vscode.TextDocument) {
    const text = document.getText();
    
    try {
      const baseConfig = {
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
          "no-console": "warn",
          "no-unused-vars": "warn",
          "no-redeclare": "error",
          "no-var": "warn",
          "no-unreachable": "error",
          "no-extra-semi": "warn",
          "quotes": ["warn", "single"],
          "eqeqeq": ["warn", "always"],
          "semi": ["warn", "always"],
          "no-undef": "error",
          "react/jsx-pascal-case": "error",
          "react-hooks/rules-of-hooks": "error",
          "react-hooks/exhaustive-deps": "warn",
          "import/no-unresolved": "error",
          "import/named": "error",
          "import/default": "error",
          "import/namespace": "error",
          "import/no-absolute-path": "error",
        }
      };

      const fixESLint = new ESLint({
        cwd: this.extensionPath,
        useEslintrc: false,
        fix: true,
        baseConfig: baseConfig as any,
      } as ESLint.Options);
      
      const results = await fixESLint.lintText(text, {
        filePath: document.uri.fsPath,
        warnIgnored: true
      });
      
      return results;
    } catch (error) {
      logger.error(`Error getting auto-fix results: ${error}`);
      throw error;
    }
  }

  /**
   * Provides code actions for ESLint diagnostics
   */
  private async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext
  ): Promise<vscode.CodeAction[]> {
    const actions: vscode.CodeAction[] = [];

    // First, add all the existing disable actions
    for (const diagnostic of context.diagnostics) {
      if (!diagnostic.source?.startsWith('freelint')) {
        continue;
      }

      // Extract rule ID from diagnostic source (format: freelint(rule-id))
      const ruleId = diagnostic.source.match(/\((.*?)\)/)?.[1];
      if (!ruleId) continue;

      // Add action to disable the rule for the line
      const disableLineAction = new vscode.CodeAction(
        `Disable ${ruleId} for this line`,
        vscode.CodeActionKind.QuickFix
      );
      
      const lineText = document.lineAt(diagnostic.range.start.line).text;
      const indentation = lineText.match(/^\s*/)?.[0] || '';
      
      disableLineAction.edit = new vscode.WorkspaceEdit();
      disableLineAction.edit.insert(
        document.uri,
        new vscode.Position(diagnostic.range.start.line, 0),
        `${indentation}// eslint-disable-next-line ${ruleId}\n`
      );
      
      actions.push(disableLineAction);

      // Add action to disable the rule for the entire file
      const disableFileAction = new vscode.CodeAction(
        `Disable ${ruleId} for entire file`,
        vscode.CodeActionKind.QuickFix
      );
      
      disableFileAction.edit = new vscode.WorkspaceEdit();
      disableFileAction.edit.insert(
        document.uri,
        new vscode.Position(0, 0),
        `/* eslint-disable ${ruleId} */\n`
      );
      
      actions.push(disableFileAction);
    }

    // Now try to add auto-fix capabilities
    try {
      // Only proceed if there are diagnostics to fix
      if (context.diagnostics.length > 0) {
        // Get ESLint fixes for the entire file using our helper method
        const text = document.getText();
        const results = await this.getAutoFixResults(document);

        const eslintResult = results[0];
        
        // Check if there are any auto-fixable problems
        if (eslintResult?.output && eslintResult.output !== text) {
          // Add "Fix all auto-fixable problems" action
          const fixAllAction = new vscode.CodeAction(
            "Fix all auto-fixable problems",
            vscode.CodeActionKind.SourceFixAll
          );
          
          fixAllAction.edit = new vscode.WorkspaceEdit();
          fixAllAction.edit.replace(
            document.uri,
            new vscode.Range(
              document.positionAt(0),
              document.positionAt(text.length)
            ),
            eslintResult.output
          );
          
          actions.push(fixAllAction);
          
          // Check for individual rule fixes and add them if possible
          for (const diagnostic of context.diagnostics) {
            if (!diagnostic.source?.startsWith('freelint')) {
              continue;
            }
            
            const ruleId = diagnostic.source.match(/\((.*?)\)/)?.[1];
            if (!ruleId) continue;
            
            // Find fixes specific to this rule and diagnostic range
            const fixes = eslintResult.messages
              .filter((msg: ESLintMessage) => msg.ruleId === ruleId && msg.fix)
              .map((msg: ESLintMessage) => msg.fix as ESLintFix);
              
            if (fixes.length > 0) {
              const fixAction = new vscode.CodeAction(
                `Fix ${ruleId} issue`,
                vscode.CodeActionKind.QuickFix
              );
              fixAction.edit = new vscode.WorkspaceEdit();
              
              // Apply all fixes for this rule
              for (const fix of fixes) {
                if (fix) {
                  fixAction.edit.replace(
                    document.uri,
                    new vscode.Range(
                      document.positionAt(fix.range[0]),
                      document.positionAt(fix.range[1])
                    ),
                    fix.text
                  );
                }
              }
              
              fixAction.diagnostics = [diagnostic];
              actions.push(fixAction);
            }
          }
        }
      }
    } catch (error) {
      logger.error(`Error providing auto-fix actions: ${error}`);
      // Even if auto-fix fails, the disable actions are still available
    }

    return actions;
  }

  /**
   * Debounce the linting to avoid excessive updates
   */
    private debounceLint(document: vscode.TextDocument): void {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      
      this.debounceTimer = setTimeout(() => {
        this.lintDocument(document).catch(err => {
          logger.error(`Error during debounced lint: ${err}`);
        });
      }, 500); // Wait 500ms after last change before linting
    }
}

// Export a function to create a new linter
export function createLinter(extensionPath: string): Linter {
  return new Linter(extensionPath);
}
