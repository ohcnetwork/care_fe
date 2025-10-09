---
applyTo: "src/context/**/*.{ts,tsx}"
---

# React Context Instructions

## Healthcare Context Architecture

### Permission Context (`PermissionContext.tsx`)
- Medical role-based permissions (Doctor, Nurse, Admin, Pharmacist)
- Patient data access control with dynamic permission checking
- Facility-level permissions for multi-facility healthcare systems
- Emergency override permissions for critical care situations

### Shortcut Context (`ShortcutContext.tsx`)
- Medical workflow keyboard shortcuts for rapid clinical actions
- Emergency protocol shortcuts for rapid response scenarios
- Accessibility shortcuts for clinical environments

## Context Implementation Patterns

### Permission Management Example
```typescript
interface PermissionContextType {
  userPermissions: Permission[];
  canAccessPatient: (patientId: string) => boolean;
  canPrescribeMedication: boolean;
  emergencyOverride: boolean;
}

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
};
```

## Healthcare Context Guidelines

### Core Context Types
- Patient Context: Current patient selection and medical alerts
- Facility Context: Department location and resource availability  
- Emergency Context: Critical care protocols and rapid response
- Audit Context: HIPAA compliance and data access logging

### Implementation Standards
- Use TypeScript interfaces for all context types
- Include proper error boundaries for medical data
- Implement audit logging for PHI access
- Handle offline scenarios for critical workflows

### Security Requirements
- Log all medical data access automatically
- Implement proper consent management
- Maintain audit trails for compliance
- Use data minimization principles

### Testing Requirements
- Test role-based access control
- Validate emergency override scenarios
- Verify audit trail completeness
- Test offline data handling