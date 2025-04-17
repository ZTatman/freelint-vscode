# Change Log

All notable changes to the "freelint" extension will be documented in this file.

## [0.0.6] - 2025-04-17

### Added
- Added rule documentation links in error messages - clicking on rule IDs now opens the relevant documentation
- Created utility module for generating ESLint rule documentation URLs
- Support for documentation links for core ESLint, React, React Hooks, and Import plugin rules

## [0.0.5] - 2023-05-20

### Added
- Enhanced debouncing implementation for linting operations
- Improved private member syntax using "#" prefix for better encapsulation
- More robust error handling in linting operations

### Fixed
- Fixed duplicate linting issues in certain scenarios
- Improved configuration handling for ESLint rules
- Enhanced debug logging capabilities

## [0.0.4] - 2023-05-15

### Added
- New command: `FreeLint: Set React Version for Linting`
- New setting: `freelint.reactVersion` to specify the React version for linting rules
- Enhanced logging and error reporting for better debugging
- New command: `FreeLint: Create TypeScript React Test File` for TSX linting examples

### Fixed
- Improved ESLint configuration to better handle JavaScript files
- Fixed parser configuration to properly use @babel/eslint-parser
- Restructured linter code for better organization and maintainability
- Moved test file generators to a separate module for cleaner code structure

## [0.0.3] - 2023-05-01

### Added
- Support for linting TypeScript (.ts) and TypeScript React (.tsx) files
- Test file generation for demonstrating lint capabilities
- Status bar indicator to show whether FreeLint is enabled or disabled

### Fixed
- Improved error handling when ESLint encounters parsing issues

## [0.0.2] - 2023-04-15

### Added
- Support for eslint-plugin-import to detect import/export issues
- Ability to toggle FreeLint on/off

## [0.0.1] - 2023-04-01

### Added
- Initial release of FreeLint
- Basic ESLint integration with React and React Hooks support
- Automatic linting on file open and save
