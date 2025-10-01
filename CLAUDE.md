# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the CARE frontend repository.

## Healthcare Project Context

CARE is a Digital Public Good enabling TeleICU & Decentralised Administration of Healthcare Capacity. This React + TypeScript + Vite frontend serves critical healthcare workflows including patient management, facility administration, and medical data processing.

## Build/Test Commands

- `npm install --ignore-scripts && npm run postinstall && npm run setup`: Bootstrap project
- `npm run dev`: Start development server (<http://localhost:4000>)
- `npm run build`: Build for production (takes ~2 minutes, never cancel)
- `npm run lint`: Run ESLint (takes ~85 seconds)
- `npm run format`: Format code with Prettier
- `npm run cypress:open`: Open Cypress UI for healthcare workflow testing

## Code Style Guidelines

- TypeScript: Strict mode, ES2022 target, path aliases (`@/*` for src)
- Formatting: Double quotes, 2-space indent, semicolons required
- Imports: Order by 3rd-party → library → CAREUI → UI → components → hooks → utils → relative
- Types: Use `interface` for objects, avoid explicit `any`, proper nullability
- Naming: PascalCase for components/classes, camelCase for variables/functions
- Components: Organized by feature (Patient/, Facility/, Medication/), maintain separation of concerns
- Testing: Follow Page Object Model, use data-cy attributes, AAA pattern (Arrange-Act-Assert)
- Error Handling: Use dedicated error handlers, TypeScript strict null checks

## Healthcare Standards

- Medical Data: Use zod validation, proper error boundaries, audit logging
- Security: HIPAA compliance, PHI protection, role-based access controls
- Performance: Sub-100ms response times for emergency workflows
- Accessibility: WCAG 2.1 AA compliance for medical environments

## Architecture

- React 19.1.1 with TypeScript for healthcare UI components
- CAREUI for medical-specific components, shadcn/ui for standard components
- @tanstack/react-query for medical data state management
- Tailwind CSS 4.1.3 with healthcare-specific design system
- Cypress for E2E testing of critical healthcare workflows

Refer to `.github/copilot-instructions.md` and `.github/instructions/*.instructions.md` for comprehensive guidance.
