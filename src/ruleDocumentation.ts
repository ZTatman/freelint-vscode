/**
 * This module provides utilities for generating documentation links for ESLint rules.
 */

/**
 * Base URLs for documentation of different ESLint plugins
 */
const DOCUMENTATION_BASE_URLS: Record<string, string> = {
  // Core ESLint rules
  'eslint': 'https://eslint.org/docs/rules/',
  
  // React plugin rules
  'react': 'https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/',
  
  // React Hooks plugin rules
  'react-hooks': 'https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks/README.md#',
  
  // Import plugin rules
  'import': 'https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/',
};

/**
 * Special cases for rules that don't follow the standard documentation pattern
 */
const SPECIAL_CASE_URLS: Record<string, string> = {
  // React Hooks rules have a different URL pattern
  'react-hooks/rules-of-hooks': 'https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks/README.md#rules-of-hooks',
  'react-hooks/exhaustive-deps': 'https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks/README.md#exhaustive-deps',
};

/**
 * Generate a documentation URL for an ESLint rule
 * 
 * @param ruleId The ESLint rule ID (e.g., 'no-unused-vars' or 'react/jsx-key')
 * @returns A URL to the rule's documentation, or undefined if no documentation URL can be generated
 */
export function getRuleDocumentationUrl(ruleId: string | null): string | undefined {
  if (!ruleId) {
    return undefined;
  }
  
  // Check if this is a special case rule with a custom URL
  if (SPECIAL_CASE_URLS[ruleId]) {
    return SPECIAL_CASE_URLS[ruleId];
  }
  
  // Handle plugin rules (format: 'plugin-name/rule-name')
  if (ruleId.includes('/')) {
    const [pluginName, ruleName] = ruleId.split('/');
    
    // Check if we have a base URL for this plugin
    if (DOCUMENTATION_BASE_URLS[pluginName]) {
      return `${DOCUMENTATION_BASE_URLS[pluginName]}${ruleName}.md`;
    }
  } else {
    // Handle core ESLint rules
    return `${DOCUMENTATION_BASE_URLS.eslint}${ruleId}`;
  }
  
  return undefined;
}
