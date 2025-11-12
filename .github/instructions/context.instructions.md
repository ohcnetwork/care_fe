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

## Implementation Guidelines

### Core Context Types
- Permission Context: Medical role-based permissions and patient data access
- Shortcut Context: Medical workflow keyboard shortcuts
- Custom contexts should support emergency override for critical care

### Implementation Standards
- Use TypeScript interfaces for all context types
- Include proper error boundaries for critical medical data
- Implement audit logging for PHI access
- Handle offline scenarios for critical workflows
- Test role-based access control thoroughly