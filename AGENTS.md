# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Lint/Test Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production 
- `npm run lint`: Run ESLint
- `npm run lint-fix`: Run ESLint with auto-fix
- `npm run format`: Format code with Prettier
- `npm run cypress:open`: Open Cypress UI for interactive testing
- Single test: `npm run cypress:run -- --spec "cypress/e2e/path/to/spec.cy.ts"`

## Code Style Guidelines
- **TypeScript**: Strict mode, ES2022 target, path aliases (`@/*` for src)
- **Formatting**: Double quotes, 2-space indent, semicolons required
- **Imports**: Order by 3rd-party → library → CAREUI → UI → components → hooks → utils → relative
- **Types**: Use `interface` for objects, avoid explicit `any`, proper nullability
- **Naming**: PascalCase for components/classes, camelCase for variables/functions
- **Components**: Organized by feature, maintain separation of concerns
- **Testing**: Follow Page Object Model, use data-cy attributes, AAA pattern (Arrange-Act-Assert)
- **Error Handling**: Use dedicated error handlers, TypeScript strict null checks