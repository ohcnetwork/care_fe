# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the CARE frontend repository.

## Project Context

CARE is a Digital Public Good enabling TeleICU & Decentralised Administration of Healthcare Capacity. This React + TypeScript + Vite frontend serves workflows including patient management, facility administration, and data processing.

## Build/Test Commands

- `npm install --ignore-scripts && npm run postinstall && npm run setup`: Bootstrap project
- `npm run dev`: Start development server (<http://localhost:4000>)
- `npm run build`: Build for production (takes ~2 minutes, never cancel)
- `npm run lint`: Run ESLint (takes ~85 seconds)
- `npm run format`: Format code with Prettier
- `npm run cypress:open`: Open Cypress UI for testing

## Code Style Guidelines

- TypeScript: Strict mode, ES2022 target, path aliases (`@/*` for src)
- Formatting: Double quotes, 2-space indent, semicolons required
- Imports: Order by 3rd-party → library → CAREUI → UI → components → hooks → utils → relative
- Types: Use `interface` for objects, avoid explicit `any`, proper nullability
- Naming: PascalCase for components/classes, camelCase for variables/functions
- Components: Organized by feature (Patient/, Facility/, etc.), maintain separation of concerns
- Testing: Follow Page Object Model, use data-cy attributes, AAA pattern (Arrange-Act-Assert)
- Error Handling: Use dedicated error handlers, TypeScript strict null checks

## Standards

- Data: Use zod validation, proper error boundaries
- Security: Role-based access controls
- Accessibility: WCAG 2.1 AA compliance

## Architecture

- React 19.1.1 with TypeScript for UI components
- CAREUI for custom components, shadcn/ui for standard components
- @tanstack/react-query for data state management
- Tailwind CSS 4.1.3 with design system
- Cypress for E2E testing of critical workflows

Refer to `.github/copilot-instructions.md` for comprehensive guidance.
