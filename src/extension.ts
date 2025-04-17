import * as vscode from 'vscode';
import { Linter, createLinter } from './linter';
import { logger } from './logger';
import { TestCommands, createTestCommands } from './testCommands';

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

    window.showInformationMessage('Freelint Extension Activated!');

    // Lint the active editor if it's a JavaScript/JSX/TypeScript file
    if (window.activeTextEditor) {
      linter.lintDocument(window.activeTextEditor.document).catch(err => {
        logger.error(`Error linting active document: ${err}`, true);
      });
    }

    // Lint all visible editors
    if (window.visibleTextEditors.length > 0) {
      for (const editor of window.visibleTextEditors) {
        linter.lintDocument(editor.document).catch(err => {
          logger.error(`Error linting visible documents: ${err}`, true);
        });
      }
    }

    // Register the manual lint command
    const lintCommand = registerCommand('freelint.lintFile', async () => {
      const editor = window.activeTextEditor;
      if (!editor) {
        logger.error('No active editor', true);
        window.showErrorMessage('No active editor');
        return;
      }
      await linter.lintDocument(editor.document);
    });

    // Register a debug command to manually trigger logging
    const debugCommand = registerCommand('freelint.debugLog', async () => {
      const editor = window.activeTextEditor;
      if (!editor) {
        logger.error('No active editor', true);
        window.showErrorMessage('No active editor');
        return;
      }
      await linter.lintDocument(editor.document);
      logger.logDiagnosticsSummary(
        editor.document.uri,
        linter.getDiagnosticCollection(),
        linter.getEslintVersion()
      );
    });

    // Register a command to create and open a test file
    const createReactTestCommand = registerCommand('freelint.createReactTestFile', async () => {
      // Create a temp file
      const workspaceFolder = workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        logger.error('No workspace folder open', true);
        window.showErrorMessage('No workspace folder open');
        return;
      }

      await testCommands.createReactTestFile(workspaceFolder);
    });

    const createImportExportTestCommand = registerCommand(
      'freelint.createImportExportTestFile',
      async () => {
        // Create a temp file
        const workspaceFolder = workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          logger.error('No workspace folder open', true);
          window.showErrorMessage('No workspace folder open');
          return;
        }
        await testCommands.createImportExportTestFile(workspaceFolder);
      }
    );

    // Register a command to toggle FreeLint on/off
    const toggleCommand = registerCommand('freelint.toggle', async () => {
      const isEnabled = linter.toggle();
      updateStatusBar(isEnabled);
      if (isEnabled) {
        logger.info('FreeLint enabled');
        window.showInformationMessage('FreeLint enabled');

        // Re-lint the active document
        if (window.activeTextEditor) {
          await linter.lintDocument(window.activeTextEditor.document);
        }
      } else {
        logger.info('FreeLint disabled - diagnostics cleared');
        window.showInformationMessage('FreeLint disabled');
      }
    });

    const createJavaScriptTestCommand = registerCommand(
      'freelint.createJavaScriptTestFile',
      async () => {
        const workspaceFolder = workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          logger.error('No workspace folder open', true);
          window.showErrorMessage('No workspace folder open');
          return;
        }
        await testCommands.createJavaScriptTestFile(workspaceFolder);
      }
    );

    // Sets up automatic linting on file save
    const saveListener = workspace.onDidSaveTextDocument(async document => {
      if (!document.fileName.includes('extension-output')) {
        await linter.lintDocument(document);
      }
    });

    // Lint files when they are opened
    const openListener = workspace.onDidOpenTextDocument(async document => {
      if (!document.fileName.includes('extension-output')) {
        await linter.lintDocument(document);
      }
    });

    // Also lint when an editor becomes active
    const activeEditorListener = window.onDidChangeActiveTextEditor(async editor => {
      if (editor && !editor.document.fileName.includes('extension-output')) {
        await linter.lintDocument(editor.document);
      }
    });

    // Register a command to set React version
    const setReactVersionCommand = registerCommand('freelint.setReactVersion', async () => {
      // Provide common React versions as options
      const reactVersions = [
        '18.2.0', // Current stable
        '18.0.0', // React 18 initial
        '17.0.2', // React 17 latest
        '16.14.0', // React 16 latest
        '16.8.0', // First with hooks
      ];

      // Get current setting
      const currentVersion = workspace.getConfiguration('freelint').get('reactVersion', '18.2.0');

      // Show picker with current version highlighted
      const selectedVersion = await window.showQuickPick(reactVersions, {
        placeHolder: `Select React version for linting (current: ${currentVersion})`,
      });

      if (selectedVersion) {
        // Update the setting
        await workspace
          .getConfiguration('freelint')
          .update('reactVersion', selectedVersion, vscode.ConfigurationTarget.Global);

        // Show confirmation
        window.showInformationMessage(`React version set to ${selectedVersion}.`);

        // Reload linter with new settings
        linter = createLinter(context.extensionPath);

        // Re-lint the active document
        const editor = window.activeTextEditor;
        if (editor) {
          await linter.lintDocument(editor.document);
        }
      }
    });

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
      statusBarItem,
      setReactVersionCommand
    );

    // Create and initialize status bar item
    statusBarItem = window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'freelint.toggle';
    updateStatusBar(true); // Initial state is enabled
    statusBarItem.show();
  } catch (error) {
    logger.error(`Initialization error: ${error}`, true);
    window.showErrorMessage(`Failed to initialize linter: ${error}`);
  }
}

/**
 * This function is not exported because it's only used internally within this module.
 * It's a helper function for updating the status bar and doesn't need to be accessed
 * from outside this file.
 */
function updateStatusBar(enabled: boolean): void {
  statusBarItem.text = enabled ? '$(check) FreeLint' : '$(x) FreeLint';
  statusBarItem.tooltip = enabled
    ? 'FreeLint enabled - Click to disable'
    : 'FreeLint disabled - Click to enable';
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
