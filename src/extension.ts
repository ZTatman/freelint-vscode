import * as vscode from "vscode";
import * as path from "path";
import { logger } from "./logger";
import { Linter, createLinter } from "./linter";

// // Import eslint plugins
// // eslint-disable-next-line @typescript-eslint/no-var-requires
// const eslintPluginReact = require('eslint-plugin-react');
// // eslint-disable-next-line @typescript-eslint/no-var-requires
// const eslintPluginReactHooks = require('eslint-plugin-react-hooks');

let linter: Linter;

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("Freelint Extension Activated!");
  
  try {
    // Initialize linter
    linter = createLinter(context.extensionPath);

    // Lint the active editor if it's a JavaScript/JSX/TypeScript file
    if (vscode.window.activeTextEditor) {
      linter.lintDocument(vscode.window.activeTextEditor.document).catch(err => {
        logger.error(`Error linting active document: ${err}`);
      });
    }

    // Lint all visible editors
    if (vscode.window.visibleTextEditors.length > 0) {
      for (const editor of vscode.window.visibleTextEditors) {
        linter.lintDocument(editor.document).catch(err => {
          logger.error(`Error linting visible document: ${err}`);
        });
      }
    }

    // Register the manual lint command
    const lintCommand = vscode.commands.registerCommand(
      "freelint.lintFile",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          return;
        }
        await linter.lintDocument(editor.document);
      }
    );
    
    // Register a debug command to manually trigger logging
    const debugCommand = vscode.commands.registerCommand(
      "freelint.debugLog",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          await linter.lintDocument(editor.document);
          logger.logDiagnosticsSummary(
            editor.document.uri, 
            linter.getDiagnosticCollection(), 
            linter.getEslintVersion()
          );
        } else {
          logger.info("No active editor", true);
        }
      }
    );

    // Register a command to create and open a test file
    const createTestCommand = vscode.commands.registerCommand(
      "freelint.createTestFile",
      async () => {
        // Create a temp file
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          vscode.window.showErrorMessage("No workspace folder open");
          return;
        }
        
        await linter.createTestFile(workspaceFolder);
      }
    );

    // Sets up automatic linting on file save
    const saveListener = vscode.workspace.onDidSaveTextDocument(
      async (document) => {
        await linter.lintDocument(document);
      }
    );

    // Lint files when they are opened
    const openListener = vscode.workspace.onDidOpenTextDocument(
      async (document) => {
        // Log when a document is opened
        logger.info(`Document opened: ${document.fileName}`);
        await linter.lintDocument(document);
      }
    );

    // Also lint when an editor becomes active
    const activeEditorListener = vscode.window.onDidChangeActiveTextEditor(
      async (editor) => {
        if (editor) {
          logger.info(`Editor became active: ${editor.document.fileName}`);
          await linter.lintDocument(editor.document);
        }
      }
    );

    // Add subscriptions
    context.subscriptions.push(
      lintCommand, 
      debugCommand,
      createTestCommand,
      saveListener, 
      openListener,
      activeEditorListener
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to initialize linter: ${error}`);
    logger.error(`Initialization error: ${error}`);
  }
}

export function deactivate() {
  if (linter) {
    linter.dispose();
  }
}
