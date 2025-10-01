---
applyTo: "src/Providers/**/*.{ts,tsx}"
---

# Provider Components Instructions

## Healthcare Provider Architecture

### Core Providers
- AuthUserProvider: Healthcare staff authentication and role management
- PatientUserProvider: Patient authentication for public appointment booking
- HistoryAPIProvider: Navigation history for clinical workflows

### Authentication Patterns
```typescript
// Healthcare role-based provider example
export const AuthUserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserRead | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  
  return (
    <AuthUserContext.Provider value={{
      user,
      permissions,
      canAccessPatient: (patientId: string) => hasPermission('view_patient'),
      canPrescribeMedication: hasPermission('prescribe_medication'),
    }}>
      {children}
    </AuthUserContext.Provider>
  );
};
```

## Provider Implementation Guidelines

### State Management
- Use React hooks for local provider state
- Integrate with @tanstack/react-query for server state  
- Handle loading, error, and success states consistently
- Implement proper cleanup and memory management

### Healthcare Compliance
- Log all medical data access for HIPAA compliance
- Implement audit trails for sensitive operations
- Handle PHI with proper encryption and security
- Support emergency override scenarios for critical care

### Error Handling
- Provide fallback UI for provider failures
- Log errors appropriately without exposing PHI
- Handle network failures gracefully
- Implement retry logic for critical operations

### Testing Requirements
- Test provider state management and updates
- Verify authentication and authorization flows
- Test emergency scenarios and override mechanisms
- Validate audit logging and compliance features