# AGENTS.md

This file provides guidance for AI coding agents working with the CARE frontend repository.

## Complete Instructions System

This repository uses a comprehensive instructions system:

- Main Instructions: Complete project overview and workflows (`.github/copilot-instructions.md`)
- Agent Environment: Pre-configured development environment (`.github/workflows/copilot-setup-steps.yml`)

## Project Context

CARE is a Digital Public Good for TeleICU & Decentralised Administration of Healthcare Capacity. This is a React + TypeScript + Vite healthcare management application.

## Build/Lint/Test Commands

```bash
npm run dev          # Start development server on http://localhost:4000
npm run build        # Build for production (~2 minutes)
npm run lint         # Run ESLint (~85 seconds)
npm run format       # Format code with Prettier
npm run playwright:test:ui # Open Playwright UI for testing
```

## Code Style Standards

- TypeScript: Strict mode for data safety, type definitions
- Components: Feature-based organization (Patient/, Facility/, etc.)
- State Management: @tanstack/react-query for server data, React hooks for UI state
- UI System: shadcn/ui for standard components, CAREUI for custom components
- Testing: Playwright E2E testing for critical workflows
