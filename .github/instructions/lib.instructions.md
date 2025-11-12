---
applyTo: "src/lib/**/*.{ts,tsx}"
---

# Library Utilities Instructions

## Core Library Functions

### Utility Functions (`utils.ts`)
- cn(): Conditional class name utility using `clsx` and `tailwind-merge`
- Class variance authority: Component variant styling patterns

### Validation Libraries (`validators.ts`)
- Medical data validation for patient identifiers and clinical data
- Form validation for healthcare-specific requirements

## Implementation Guidelines

## Implementation Standards

### Error Handling
- Handle errors without exposing PHI/PII
- Provide meaningful error messages
- Use TypeScript's strict null checks

### Healthcare Standards
- Clinical API models are extensions of FHIR resources
- Support medical coding systems (SNOMED CT, LOINC)