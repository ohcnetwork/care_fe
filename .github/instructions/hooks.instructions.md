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

### Implementation
- Use `useState` for local state, `@tanstack/react-query` for server state
- Handle loading, error, and success states consistently
- Implement proper cleanup for subscriptions and timers
- Use TypeScript strict typing

### Healthcare Patterns
- Validate medical data with `zod` schemas
- Handle PHI securely
- Provide meaningful error messages
- Debounce search operations
- Implement retry logic for critical operations
