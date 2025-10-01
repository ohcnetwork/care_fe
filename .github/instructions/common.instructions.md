---
applyTo: "src/common/**/*.{ts,tsx}"
---

# Core Common Utilities Instructions

## Healthcare Common Files

### Permission System (`Permissions.tsx`)
- Role-based access control for medical staff (Doctor, Nurse, Admin)
- Dynamic permission checking with `getPermissions()` function
- Emergency override permissions for critical care situations

### Application Constants (`constants.tsx`)  
- Core application configuration and medical standards
- `RESULTS_PER_PAGE_LIMIT` for medical record pagination
- `LocalStorageKeys` for secure medical data storage
- Medical unit constants and reference values

### Validation Utilities (`validation.tsx`)
- Medical data validation schemas using `zod`
- Clinical data validation (vital signs, medication dosages)
- Healthcare system password and identifier validation

## Implementation Patterns

### Medical Permission Checking
```typescript
// Role-based permission example
export const canAccessPatientData = (user: UserRead, patientId: string) => {
  return (
    hasPermission(user, "view_patient") ||
    isAssignedToPatient(user, patientId) ||
    isEmergencyOverride(user)
  );
};
```

### Clinical Data Validation
```typescript
// Vital signs validation example
export const validateVitalSigns = (vitals: VitalSigns) => {
  const schema = z.object({
    temperature: z.number().min(95).max(110),
    heartRate: z.number().min(30).max(200),
    bloodPressure: z.object({
      systolic: z.number().min(60).max(250),
      diastolic: z.number().min(40).max(150),
    }),
  });
  return schema.safeParse(vitals);
};
```

## Security & Compliance

### PHI Protection Requirements
- Never log sensitive medical information in error messages
- Use encrypted storage for temporary medical data
- Implement data masking for unauthorized users
- Handle HIPAA compliance in all data operations

### Audit Trail Implementation
- Log all medical record access and modifications
- Track medication administration and critical events
- Maintain user action history for compliance audits
- Record facility access and security events