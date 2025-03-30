import * as vscode from "vscode";
import { logger } from "./logger";
import { Linter, createLinter } from "./linter";
import { TestCommands, createTestCommands } from "./testCommands";

let linter: Linter;
let testCommands: TestCommands;
let statusBarItem: vscode.StatusBarItem;

/**
 * This function is exported because it's the entry point for the VS Code extension.
 * VS Code requires extensions to export an 'activate' function that will be called
 * when the extension is activated.
 */
export function activate(context: vscode.ExtensionContext) {
  // Initialize vscode.commands, vscode.window, and vscode.workspace
  const registerCommand = vscode.commands.registerCommand;
  const window = vscode.window;
  const workspace = vscode.workspace;
  try {
    // Initialize linter
    linter = createLinter(context.extensionPath);

    // Initialize test commands
    testCommands = createTestCommands(linter);

    // Lint the active editor if it's a JavaScript/JSX/TypeScript file
    if (window.activeTextEditor) {
      linter.lintDocument(window.activeTextEditor.document).catch((err) => {
        logger.error(`Error linting active document: ${err}`);
      });
    }

    // Lint all visible editors
    if (window.visibleTextEditors.length > 0) {
      for (const editor of window.visibleTextEditors) {
        linter.lintDocument(editor.document).catch((err) => {
          logger.error(`Error linting visible document: ${err}`);
        });
      }
    }

    // Register the manual lint command
    const lintCommand = registerCommand("freelint.lintFile", async () => {
      const editor = window.activeTextEditor;
      if (!editor) {
        return;
      }
      await linter.lintDocument(editor.document);
    });

    // Register a debug command to manually trigger logging
    const debugCommand = registerCommand("freelint.debugLog", async () => {
      const editor = window.activeTextEditor;
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
    });

    // Register a command to create and open a test file
    const createReactTestCommand = registerCommand(
      "freelint.createReactTestFile",
      async () => {
        // Create a temp file
        const workspaceFolder = workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          window.showErrorMessage("No workspace folder open");
          return;
        }

        await testCommands.createReactTestFile(workspaceFolder);
      }
    );

    const createImportExportTestCommand = registerCommand(
      "freelint.createImportExportTestFile",
      async () => {
        // Create a temp file
        const workspaceFolder = workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          window.showErrorMessage("No workspace folder open");
          return;
        }
        await testCommands.createImportExportTestFile(workspaceFolder);
      }
    );

    // Register a command to toggle FreeLint on/off
    const toggleCommand = registerCommand("freelint.toggle", async () => {
      const isEnabled = linter.toggle();
      updateStatusBar(isEnabled);
      if (isEnabled) {
        logger.info("FreeLint enabled", true);
        window.showInformationMessage("FreeLint enabled");

        // Re-lint the active document
        if (window.activeTextEditor) {
          await linter.lintDocument(window.activeTextEditor.document);
        }
      } else {
        logger.info("FreeLint disabled - diagnostics cleared", true);
        window.showInformationMessage("FreeLint disabled");
      }
    });

    const createJavaScriptTestCommand = registerCommand(
      "freelint.createJavaScriptTestFile",
      async () => {
        const workspaceFolder = workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          window.showErrorMessage("No workspace folder open");
          return;
        }
        await testCommands.createJavaScriptTestFile(workspaceFolder);
      }
    );

    // Sets up automatic linting on file save
    const saveListener = workspace.onDidSaveTextDocument(async (document) => {
      await linter.lintDocument(document);
    });

    // Lint files when they are opened
    const openListener = workspace.onDidOpenTextDocument(async (document) => {
      // Log when a document is opened
      logger.info(`Document opened: ${document.fileName}`);
      await linter.lintDocument(document);
    });

    // Also lint when an editor becomes active
    const activeEditorListener = window.onDidChangeActiveTextEditor(
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
      createReactTestCommand,
      createImportExportTestCommand,
      createJavaScriptTestCommand,
      toggleCommand,
      saveListener,
      openListener,
      activeEditorListener,
      statusBarItem
    );

    // Create and initialize status bar item
    statusBarItem = window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    statusBarItem.command = "freelint.toggle";
    updateStatusBar(true); // Initial state is enabled
    statusBarItem.show();
  } catch (error) {
    window.showErrorMessage(`Failed to initialize linter: ${error}`);
    logger.error(`Initialization error: ${error}`);
  } finally {
    window.showInformationMessage("Freelint Extension Activated!");
  }
}

/**
 * This function is not exported because it's only used internally within this module.
 * It's a helper function for updating the status bar and doesn't need to be accessed
 * from outside this file.
 */
function updateStatusBar(enabled: boolean): void {
  statusBarItem.text = enabled ? "$(check) FreeLint" : "$(x) FreeLint";
  statusBarItem.tooltip = enabled
    ? "FreeLint enabled - Click to disable"
    : "FreeLint disabled - Click to enable";
}

/**
 * This function is exported because VS Code requires extensions to export a 'deactivate'
 * function that will be called when the extension is deactivated. This allows for
 * proper cleanup of resources.
 */
export function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
  if (linter) {
    linter.dispose();
  }
}
