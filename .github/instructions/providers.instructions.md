---
applyTo: "src/Providers/**/*.{ts,tsx}"
---

# Provider Components Instructions

## Core Providers
- AuthUserProvider: Authenticated user and role management
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

### Error Handling
- Provide fallback UI for provider failures
- Log errors appropriately without exposing PII
- Handle network failures gracefully
- Implement retry logic for critical operations

### Testing Requirements
- Test provider state management and updates
- Verify authentication and authorization flows
- Test emergency scenarios and override mechanisms
- Validate audit logging and compliance features