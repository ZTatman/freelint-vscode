import * as path from "path";
import * as vscode from "vscode";
import { Linter } from "./linter";
import { logger } from "./logger";

/**
 * Class to handle creation of test files for demonstrating linting capabilities.
 */
export class TestCommands {
  #linter: Linter;

  constructor(linter: Linter) {
    this.#linter = linter;
  }

  /**
   * Create a react test file with various lint issues.
   * @param workspaceFolder The workspace folder to create the file in
   */
  public async createReactTestFile(
    workspaceFolder: vscode.WorkspaceFolder
  ): Promise<void> {
    const testFilePath = path.join(
      workspaceFolder.uri.fsPath,
      "test-react.jsx"
    );
    const testContent = `
import React, { useState, useEffect, useCallback } from 'react';

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
      await this.#linter.lintDocument(document);

      // Show a message in the output channel
      logger.info(
        `Created react test file: ${path.basename(testFilePath)}`,
        true
      );
      vscode.window.showInformationMessage(
        "React test file created with lint issues. Check 'FreeLint' output for details."
      );
    } catch (error) {
      logger.error(`Error creating react test file: ${error}`);
      vscode.window.showErrorMessage(
        `Failed to create react test file: ${error}`
      );
    }
  }

  /**
   * Creates a test file with import/export errors to demonstrate eslint-plugin-import rules.
   * @param workspaceFolder The workspace folder to create the file in
   */
  public async createImportExportTestFile(
    workspaceFolder: vscode.WorkspaceFolder
  ): Promise<void> {
    const testFilePath = path.join(
      workspaceFolder.uri.fsPath,
      "import-export-test.js"
    );

    // Create a supporting module file to make some of the errors more realistic
    const supportingModulePath = path.join(
      workspaceFolder.uri.fsPath,
      "some-local-module.js"
    );

    const supportingModuleContent = `
// A supporting module with some exports
export const validExport = 'This export exists';
// Note: nonExistentExport is not exported
`;

    const testContent = `// This file contains various import/export errors to test eslint-plugin-import rules

// Error: import/no-unresolved - Importing a module that doesn't exist
import nonExistentModule from 'non-existent-module';

// Error: import/named - Importing a named export that doesn't exist
import { nonExistentExport } from './some-local-module';

// Error: import/default - Importing a default export from a module that doesn't have one
import defaultExport from './some-local-module';

// Error: import/namespace - Using a property that doesn't exist on a namespace import
import * as myNamespace from './some-local-module';
const value = myNamespace.nonExistentProperty;

// Error: import/no-absolute-path - Using an absolute path import
import absolutePath from '/absolute/path/to/module';

// Error: import/export - Multiple default exports
export default function myFunction() {
  return 'Hello world';
}

export default class MyClass {
  constructor() {
    this.name = 'MyClass';
  }
}

// Error: import/no-mutable-exports - Exporting mutable variables
export let mutableVar = 'This will change';

// Error: import/no-named-as-default-member - Using a named export as a property of the default export
import someModule from './some-local-module';
const namedExport = someModule.validExport;

// Error: import/first - Import not at top of file
const someVariable = 'This should come after imports';
import { lateImport } from './some-local-module';

// Error: import/no-duplicates - Duplicate imports
import { validExport as duplicate } from './some-local-module';
import { validExport as aliasedDuplicate } from './some-local-module';

// Error: import/order - Incorrect import order
import './side-effect-module';
import React from 'react';
import { useState } from 'react';
import localModule from './some-local-module';

console.log('This file demonstrates various import/export errors');
`;

    try {
      // Create a URI for the test file
      const uri = vscode.Uri.file(testFilePath);

      // Create a URI for the supporting module
      const supportingUri = vscode.Uri.file(supportingModulePath);

      // Write the supporting module content to the file
      await vscode.workspace.fs.writeFile(
        supportingUri,
        Buffer.from(supportingModuleContent, "utf8")
      );

      // Write the test content to the file
      await vscode.workspace.fs.writeFile(
        uri,
        Buffer.from(testContent, "utf8")
      );

      // Open the file
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document);

      // Trigger linting
      await this.#linter.lintDocument(document);

      // Show a message in the output channel
      logger.info(
        `Created import/export test file: ${path.basename(testFilePath)}`,
        true
      );
      vscode.window.showInformationMessage(
        "Import/export test file created with lint issues. Check 'FreeLint' output for details."
      );
    } catch (error) {
      logger.error(`Error creating import/export test file: ${error}`);
      vscode.window.showErrorMessage(
        `Failed to create import/export test file: ${error}`
      );
    }
  }

  /**
   * Create a JavaScript test file with various general ESLint errors.
   * @param workspaceFolder The workspace folder to create the file in
   */
  public async createJavaScriptTestFile(
    workspaceFolder: vscode.WorkspaceFolder
  ): Promise<void> {
    const testFilePath = path.join(
      workspaceFolder.uri.fsPath,
      "test-javascript.js"
    );
    const testContent = `
// Missing semicolons
const missingTerminator = 5
let anotherMissing = "hello"

// Unused variables
const unusedVar = "This variable is never used";

// No-console violations
console.log("This will trigger a no-console warning");
console.error("This is another console method that will be flagged");

// Extra semicolons
const extraSemi = 5;;

// Mixed quotes
const singleQuotes = 'single quotes are preferred';
const doubleQuotes = "double quotes will trigger a warning";

// Unreachable code
function unreachableDemo() {
  return true;
  // This code will never execute
  const unreachable = "This is unreachable";
}

// Comparison issues
if (1 == '1') {
  // Should use === instead of ==
  console.log('Loose equality used instead of strict equality');
}

// Undefined variables
function undefinedVarDemo() {
  undefinedVariable = 10; // Using a variable without declaring it
}

// Redeclaration of variables
let redeclared = 1;
let redeclared = 2; // Error: redeclared is already defined

// Unused function parameters
function unusedParams(a, b, c) {
  return a + 5; // b and c are never used
}

// Inconsistent return
function inconsistentReturn(value) {
  if (value) {
    return true;
  }
  // Missing return in this code path
}

// No-var rule (prefer let/const)
var oldStyleVar = "Should use let or const instead";

// Empty block statements
if (true) {
  // Empty block
}

// This file demonstrates various JavaScript errors that ESLint will catch
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
      await this.#linter.lintDocument(document);

      // Show a message in the output channel
      logger.info(
        `Created JavaScript test file: ${path.basename(testFilePath)}`,
        true
      );
      vscode.window.showInformationMessage(
        "JavaScript test file created with lint issues. Check 'FreeLint' output for details."
      );
    } catch (error) {
      logger.error(`Error creating JavaScript test file: ${error}`);
      vscode.window.showErrorMessage(
        `Failed to create JavaScript test file: ${error}`
      );
    }
  }
}

// Function to create a new TestCommands instance
export function createTestCommands(linter: Linter): TestCommands {
  return new TestCommands(linter);
}
