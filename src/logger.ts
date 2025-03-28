import * as vscode from "vscode";

/**
 * Logger class to handle all output channel and debug logging functionality.
 */
export class Logger {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel("FreeLint");
    this.info("FreeLint extension activated");
  }

  /**
   * Log an error message and optionally show the output channel.
   * @param message The error message to log
   * @param show Whether to show the output channel
   */
  public error(message: string, show = true): void {
    this.outputChannel.appendLine(`[ERROR] ${message}`);
    if (show) {
      this.outputChannel.show(true);
    }
  }

  /**
   * Log an info message and optionally show the output channel.
   * @param message The info message to log
   * @param show Whether to show the output channel
   */
  public info(message: string, show = false): void {
    this.outputChannel.appendLine(message);
    if (show) {
      this.outputChannel.show(true);
    }
  }

  /**
   * Clear the output channel
   */
  public clear(): void {
    this.outputChannel.clear();
  }

  /**
   * Log linting results summary for a file.
   * @param fileName Name of the file that was linted
   * @param errorCount Number of errors found
   * @param warningCount Number of warnings found
   */
  public logLintResults(
    fileName: string,
    errorCount: number,
    warningCount: number
  ): void {
    if (errorCount > 0 || warningCount > 0) {
      this.info(
        `Linted ${fileName}: ${errorCount} errors, ${warningCount} warnings`,
        errorCount > 0
      );
    }
  }

  /**
   * Log debug information about linting diagnostics.
   * @param uri The URI of the document
   * @param diagnosticCollection The diagnostic collection
   * @param eslintVersion ESLint version
   */
  public logDiagnosticsSummary(
    uri: vscode.Uri,
    diagnosticCollection: vscode.DiagnosticCollection,
    eslintVersion: string
  ): void {
    this.clear();
    this.info("Debug logging triggered manually", true);

    // Show ESLint version and configuration
    this.info(`ESLint version: ${eslintVersion}`, true);
    this.info(`File being analyzed: ${uri.fsPath}`, true);

    // Show diagnostic information
    this.info("\n--- FreeLint Diagnostics Summary ---", true);

    // Get our own diagnostics
    const freelintDiagnostics = diagnosticCollection.get(uri) || [];
    this.info(`FreeLint found ${freelintDiagnostics.length} issues:`, true);

    // Count by rule
    const ruleCount: Record<string, number> = {};
    for (const diag of freelintDiagnostics) {
      const ruleName =
        diag.source?.replace("freelint (", "").replace(")", "") || "unknown";
      ruleCount[ruleName] = (ruleCount[ruleName] || 0) + 1;
    }

    // Display rule counts
    for (const [rule, count] of Object.entries(ruleCount)) {
      this.info(
        `  - ${rule}: ${count} ${count === 1 ? "issue" : "issues"}`,
        true
      );
    }

    // Get all diagnostics
    const allDiagnostics = vscode.languages.getDiagnostics(uri);
    if (allDiagnostics.length > freelintDiagnostics.length) {
      this.info(
        `\nOther linters found ${
          allDiagnostics.length - freelintDiagnostics.length
        } additional issues`,
        true
      );
    }
  }

  /**
   * Dispose the output channel.
   */
  public dispose(): void {
    this.outputChannel.dispose();
  }
}

// Export a singleton instance
export const logger = new Logger();
