# AGENTS.md

This file provides guidance for AI coding agents working with the CARE frontend repository.

## Complete Instructions System

This repository uses a comprehensive healthcare-focused instructions system:

- Main Instructions: Complete project overview and workflows (`.github/copilot-instructions.md`)
- Path-Specific Instructions: Context-aware guidance for specific file types (`.github/instructions/*.instructions.md`)
- Agent Environment: Pre-configured development environment (`.github/workflows/copilot-setup-steps.yml`)

For detailed project context, build instructions, and architecture information, refer to `.github/copilot-instructions.md`.

## Project Context

CARE is a Digital Public Good for TeleICU & Decentralised Administration of Healthcare Capacity. This React + TypeScript application manages:

- Patient Management: EMR, medical records, consultation workflows
- Facility Management: Bed allocation, staff assignments, resource tracking
- Medical Workflows: Prescription management, diagnostic procedures, emergency protocols
- Compliance: PHI protection, audit trails, HIPAA compliance

## Build/Lint/Test Commands

```bash
npm run dev          # Start development server on http://localhost:4000
npm run build        # Build for production (~2 minutes)
npm run lint         # Run ESLint (~85 seconds)
npm run format       # Format code with Prettier
npm run cypress:open # Open Cypress UI for workflow testing
```

## Code Style Standards

- TypeScript: Strict mode for data safety, healthcare-specific type definitions
- Components: Feature-based organization (Patient/, Facility/, Medication/)
- State Management: @tanstack/react-query for server data, React hooks for UI state
- UI System: shadcn/ui for standard components, CAREUI for custom components
- Testing: Cypress E2E testing for critical workflows
- Security: PHI protection, audit logging, compliance patterns