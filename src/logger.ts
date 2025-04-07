import * as vscode from "vscode";

/**
 * Logger class to handle all output channel and debug logging functionality.
 */
export class Logger {
  #outputChannel: vscode.OutputChannel;

  constructor() {
    this.#outputChannel = vscode.window.createOutputChannel("FreeLint");
    this.info("FreeLint extension activated");
  }

  /**
   * Log an error message and optionally show the output channel.
   * @param message The error message to log
   * @param show Whether to show the output channel
   */
  public error(message: string, show = false): void {
    this.#outputChannel.appendLine(`[ERROR]: ${message}`);
    if (show) {
      this.#outputChannel.show(true);
    }
  }

  /**
   * Log an info message and optionally show the output channel.
   * @param message The info message to log
   * @param show Whether to show the output channel
   */
  public info(message: string, show = false): void {
    this.#outputChannel.appendLine(`[INFO]: ${message}`);
    if (show) {
      this.#outputChannel.show(true);
    }
  }

  /**
   * Clear the output channel
   */
  public clear(): void {
    this.#outputChannel.clear();
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
    const message = `Linted ${fileName}: ${errorCount} errors, ${warningCount} warnings\n`;
    if (errorCount > 0 || warningCount > 0) {
      this.info(message);
    } else {
      this.debug(message);
    }
  }

  /**
   * Log detailed diagnostic information for debugging.
   * @param uri The URI of the document
   * @param diagnosticCollection The diagnostic collection
   * @param eslintVersion ESLint version
   */
  public logDiagnosticsSummary(
    uri: vscode.Uri,
    diagnosticCollection: vscode.DiagnosticCollection,
    eslintVersion: string
  ): void {
    // Show configuration information
    this.info("--- FreeLint Configuration ---", true);
    this.info(`ESLint version: ${eslintVersion}`, true);
    
    // Get and log other configuration settings
    const config = vscode.workspace.getConfiguration("freelint");
    const reactVersion = config.get("reactVersion", "18.2.0");
    const debounceDelay = config.get("debounceDelay", 500);
    const ignorePatterns = config.get<string[]>("ignorePatterns", []);
    const enabledPlugins = config.get<string[]>("plugins", ["react", "react-hooks", "import"]);
    
    this.info(`React version: ${reactVersion}`, true);
    this.info(`Debounce delay: ${debounceDelay}ms`, true);
    this.info(`Ignore patterns: ${ignorePatterns.length > 0 ? `[${ignorePatterns.join(", ")}]` : "none"}`, true);
    this.info(`Enabled plugins: [${enabledPlugins.join(", ")}]\n`, true);

    // Show diagnostic information
    this.info("--- FreeLint Diagnostics Summary ---", true);

    // Get our own diagnostics
    const freelintDiagnostics = diagnosticCollection.get(uri) || [];
    this.info(`FreeLint found ${freelintDiagnostics.length} issues:`, true);

    // Group and log issues by rule with line numbers
    const ruleGroups: Record<string, vscode.Diagnostic[]> = {};
    for (const diag of freelintDiagnostics) {
      const ruleName = diag.source || "unknown";
      if (!ruleGroups[ruleName]) {
        ruleGroups[ruleName] = [];
      }
      ruleGroups[ruleName].push(diag);
    }

    // Display issues grouped by rule
    for (const [rule, diagnostics] of Object.entries(ruleGroups)) {
      this.info(`  ${rule} found ${diagnostics.length} issues:`, true);
      for (const diag of diagnostics) {
        const line = diag.range.start.line + 1;
        const ruleCode = diag.code ? `(${diag.code})` : '';
        this.info(`    - Line ${line} ${ruleCode}: ${diag.message}`, true);
      }
    }

    // Log other linters' issues
    this.#logOtherLinterIssues(uri);
  }

  /**
   * Dispose the output channel.
   */
  public dispose(): void {
    this.#outputChannel.dispose();
  }

  public debug(message: string): void {
    if (this.#outputChannel) {
      this.#outputChannel.appendLine(`[DEBUG]: ${message}`);
    }
  }

  #logOtherLinterIssues(uri: vscode.Uri): void {
    const allDiagnostics = vscode.languages.getDiagnostics(uri);
    const otherLinterDiagnostics = allDiagnostics.filter(d => !d.source?.startsWith('freelint'));
    
    if (otherLinterDiagnostics.length > 0) {
      // Group diagnostics by source (linter name)
      const linterGroups: Record<string, vscode.Diagnostic[]> = {};
      for (const diag of otherLinterDiagnostics) {
        const linterName = diag.source || 'unknown';
        if (!linterGroups[linterName]) {
          linterGroups[linterName] = [];
        }
        linterGroups[linterName].push(diag);
      }

      // Log each linter's issues
      this.info(`Other linters found ${otherLinterDiagnostics.length} additional issues:`, true);
      for (const [linterName, diagnostics] of Object.entries(linterGroups)) {
        this.info(`  ${linterName} found ${diagnostics.length} issues:`, true);
        for (const diag of diagnostics) {
          const line = diag.range.start.line + 1;
          const ruleCode = diag.code ? `(${diag.code})` : '';
          this.info(`    - Line ${line} ${ruleCode}: ${diag.message}`, true);
        }
      }
    }
  }
}

// Export a singleton instance
export const logger = new Logger();
