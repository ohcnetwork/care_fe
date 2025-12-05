---
applyTo: "src/Utils/**/*.{ts,tsx}"
---

# Utility Functions Instructions

## Utility Organization Guidelines

### Structure and Naming
- Keep utilities organized by functionality in `src/Utils/`
- Use descriptive file names that indicate the utility's purpose
- Export functions with clear, self-documenting names
- Group related utilities in the same file

### TypeScript Best Practices
- Always provide proper TypeScript types for parameters and return values
- Use generic types where appropriate for reusability
- Avoid `any` type; use `unknown` or proper type assertions
- Export interfaces and types alongside utility functions

### Pure Functions
- Prefer pure functions that don't have side effects
- Functions should be predictable and testable
- Avoid modifying input parameters; return new objects/arrays
- Use immutable data patterns

### Error Handling
- Implement proper error handling with try-catch blocks
- Return meaningful error messages or throw specific error types
- Use TypeScript's strict null checks
- Validate input parameters when necessary

### API and Network Utilities
- Use consistent patterns for API request handling
- Implement proper error handling for network requests
- Use appropriate HTTP status code handling
- Include retry logic for transient failures when appropriate

### Date and Time Utilities
- Use `date-fns` library for date manipulations (already in dependencies)
- Handle timezone considerations properly
- Format dates consistently across the application
- Consider internationalization (i18n) for date formatting

### Validation Utilities
- Use `zod` for schema validation (already in dependencies)
- Create reusable validation schemas
- Provide clear validation error messages
- Handle both synchronous and asynchronous validation

### String and Data Manipulation
- Create helpers for common string operations
- Implement proper text sanitization and formatting
- Handle Unicode and internationalization considerations
- Use appropriate data transformation patterns

### Constants and Configuration
- Define constants in appropriate utility files
- Use enums for related constant values
- Keep configuration values in designated files
- Make constants type-safe and well-documented

### Performance Considerations
- Implement memoization for expensive computations
- Use efficient algorithms and data structures
- Avoid unnecessary object creation in frequently called functions
- Consider lazy loading for heavy utility modules

### Testing Utilities
- Create test helpers and fixtures as needed
- Implement mock data generators
- Provide utilities for common testing scenarios
- Keep test utilities separate from production code

### Documentation
- Include JSDoc comments for complex utility functions
- Provide usage examples in comments
- Document any assumptions or limitations
- Explain the purpose and behavior of non-obvious utilities