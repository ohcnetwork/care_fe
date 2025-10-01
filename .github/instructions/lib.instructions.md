---
applyTo: "src/lib/**/*.{ts,tsx}"
---

# Library Utilities Instructions

## Core Library Functions

### Utility Functions (`utils.ts`)
- cn(): Conditional class name utility using `clsx` and `tailwind-merge`
- Class variance authority: Component variant styling patterns
- Healthcare-specific data formatting and clinical calculations

### Time Management (`time.ts`)
- Medical timestamp handling for schedules and medication timing
- Multi-facility timezone coordination
- Patient age calculations and appointment scheduling

### Validation Libraries (`validators.ts`)
- Medical data validation for patient identifiers and clinical data
- Form validation for healthcare-specific requirements
- Real-time validation for critical medical inputs

## Healthcare Utility Examples

### Medical Calculation Utilities
```typescript
// BMI calculation with medical categories
export const calculateBMI = (weight: number, height: number) => {
  const bmi = weight / (height / 100) ** 2;
  return {
    value: Math.round(bmi * 10) / 10,
    category: getBMICategory(bmi),
    healthRisk: getBMIRiskLevel(bmi),
  };
};

// Medical ID formatting
export const formatMedicalId = (id: string, type: 'patient' | 'facility') => {
  const prefixes = { patient: 'PT', facility: 'FAC' };
  return `${prefixes[type]}-${id.padStart(8, '0')}`;
};
```

## Implementation Guidelines

### Healthcare Data Processing
- Handle large medical datasets efficiently
- Optimize for hospital network conditions
- Implement proper caching for medical reference data
- Support real-time data processing for monitoring

### Error Handling & Compliance
- Handle clinical errors without exposing PHI
- Maintain audit trails for medical data access
- Implement proper error recovery for critical systems
- Log performance issues affecting patient care

### Standards Support
- Support FHIR resource transformation
- Handle medical coding systems (ICD-10, SNOMED)
- Integrate with medical device data formats
- Maintain healthcare interoperability standards