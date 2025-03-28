# Changelog

## [0.0.2] - 2023-08-25

### Added

- New modular architecture with separation of concerns
- Logger module with standardized logging methods
- Dedicated Linter class to handle all ESLint operations
- Support for linting files immediately upon opening
- Enhanced error handling throughout the codebase

### Changed

- Refactored extension.ts to focus solely on extension activation and event wiring
- Improved diagnostic collection management
- Enhanced output readability with structured logging
- Simplified test file creation process
- Better organization of ESLint configuration

### Fixed

- ESQuery compatibility issue with version ^1.4.0
- Improved handling of non-file documents to prevent errors
- Better error messages with specific error sources
- Fixed inconsistent logging format

## [0.0.1] - 2023-07-15

### Added

- Initial release of FreeLint extension
- Basic ESLint functionality without requiring local installation
- Support for React and React Hooks linting
- Debug command for diagnostic information
- Test file creation command
