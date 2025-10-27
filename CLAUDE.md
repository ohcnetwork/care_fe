# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the CARE frontend repository.

## Project Context

CARE is a Digital Public Good and Hospital Management Information System (HMIS) that enables TeleICU operations and decentralized administration of healthcare capacity across healthcare facilities. This is a React + TypeScript + Vite frontend application.

## Build/Test Commands

- `npm install --ignore-scripts && npm run postinstall && npm run setup`: Bootstrap project
- `npm run dev`: Start development server (<http://localhost:4000>)
- `npm run build`: Build for production (takes ~2 minutes, never cancel)
- `npm run lint`: Run ESLint (takes ~85 seconds)
- `npm run format`: Format code with Prettier
- `npm run playwright:test:ui`: Open Playwright UI for testing

## Code Style Guidelines

- TypeScript: Strict mode, ES2022 target, path aliases (`@/*` for src)
- Formatting: Double quotes, 2-space indent, semicolons required
- Imports: Order by 3rd-party → library → CAREUI → UI → components → hooks → utils → relative
- Types: Use `interface` for objects, avoid explicit `any`, proper nullability
- Naming: PascalCase for components/classes, camelCase for variables/functions
- Components: Organized by feature (Patient/, Facility/, etc.), maintain separation of concerns
- Testing: Follow Page Object Model, use data-testid attributes, AAA pattern (Arrange-Act-Assert)
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
- Playwright for E2E testing of critical workflows

Refer to `.github/copilot-instructions.md` for comprehensive guidance.
