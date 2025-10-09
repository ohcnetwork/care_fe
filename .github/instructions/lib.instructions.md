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

### Error Handling & Compliance
- Handle errors without exposing PII
- Maintain audit trails for medical data access
- Implement proper error recovery for critical systems
- Log performance issues affecting patient care

### Standards Support
- Clinical API models are extensions of FHIR resources
- Handle medical coding systems with SNOMED CT and LOINC