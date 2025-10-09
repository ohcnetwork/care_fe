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
- Core application configuration
- `RESULTS_PER_PAGE_LIMIT` for API pagination
- `LocalStorageKeys` for secure browser storage

### Validation Utilities (`validation.tsx`)
- Form validation schemas using `zod`
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

### Form Validation
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
