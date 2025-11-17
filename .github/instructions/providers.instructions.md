---
applyTo: "src/Providers/**/*.{ts,tsx}"
---

# Provider Components Instructions

## Core Providers
- AuthUserProvider: Authenticated user and role management
- PatientUserProvider: Patient authentication for public appointment booking
- HistoryAPIProvider: Navigation history for clinical workflows

## Provider Implementation Guidelines

### State Management Integration
- Use React hooks for local provider state
- Use Jotai atoms (e.g., `userAtom` in `src/atoms/user-atom.ts`) for shared authentication state
- Integrate with @tanstack/react-query for server state
- Handle loading, error, and success states consistently
- Implement proper cleanup and memory management

### Error Handling
- Provide fallback UI for provider failures
- Log errors appropriately without exposing PHI/PII
- Handle network failures gracefully in hospital environments
- Implement retry logic for critical operations

### Testing Requirements
- Test provider state management and updates
- Verify authentication and authorization flows
- Test emergency scenarios and override mechanisms
