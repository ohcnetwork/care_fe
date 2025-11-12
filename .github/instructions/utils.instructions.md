---
applyTo: "src/Utils/**/*.{ts,tsx}"
---

# Utility Functions Instructions

## Utility Organization Guidelines

### Implementation Standards

- Organize by functionality in `src/Utils/`
- Use descriptive, self-documenting function names
- Always provide proper TypeScript types for parameters and return values
- Prefer pure functions that don't have side effects
- Implement proper error handling with try-catch where needed

### Common Patterns

- Date handling: Use `date-fns` library for all date manipulations
- Validation: Use `zod` for schema validation
- Type safety: Avoid `any` type; use proper types or `unknown`
- Documentation: Include JSDoc comments for complex utility functions
- Testing: Keep test utilities separate from production code