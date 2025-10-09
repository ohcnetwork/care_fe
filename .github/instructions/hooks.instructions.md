---
applyTo: "src/hooks/**/*.{ts,tsx}"
---

# Custom React Hooks Instructions

## Healthcare Hook Categories

### Authentication & User Management
- useAuthUser: Current user state and permissions
- usePatientUser: Patient authentication for public appointments
- usePatientSignOut: Secure patient session termination

### Medical Data Management
- useFilters: Medical record filtering and search
- useFileManager: Medical file upload and management
- useFileUpload: Healthcare document upload with validation

### UI & Navigation
- useSidebarState: Dashboard sidebar management
- useKeyboardShortcuts: Medical workflow shortcuts
- useAppHistory: Clinical workflow navigation history

## Hook Development Standards

### Implementation Patterns
- Use `useState` for local state, `@tanstack/react-query` for server state
- Handle loading, error, and success states consistently
- Implement proper cleanup for subscriptions and timers
- Use TypeScript strict typing for medical data

### Healthcare Compliance
- Validate medical data inputs using `zod` schemas
- Handle PHI with appropriate security measures
- Implement audit logging for sensitive operations
- Maintain HIPAA compliance in data handling

### Error Handling & Performance
- Provide meaningful error messages for clinical workflows
- Handle network failures gracefully in hospital environments
- Debounce search operations and optimize for slow networks
- Implement retry logic for critical medical operations