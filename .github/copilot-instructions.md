# CARE Frontend

CARE is a Digital Public Good enabling TeleICU & Decentralised Administration of Healthcare Capacity across States. This is a React + TypeScript + Vite frontend application for the healthcare management system.

## Important: Trust These Instructions
Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here. This repository has custom setup requirements and workflows that must be followed exactly.

## Architecture Overview

### Technology Stack
- Frontend Framework: React 19.1.1 with TypeScript
- Build Tool: Vite 6.3.5 for fast development and optimized builds
- Styling: Tailwind CSS 4.1.3 with custom healthcare-specific design system
- UI Components: shadcn/ui as primary system, CAREUI for healthcare-specific components
- State Management: @tanstack/react-query for server state, React hooks for client state
- Routing: raviger for application routing
- Forms: react-hook-form with zod validation for medical data integrity
- Internationalization: i18next for multi-language healthcare interfaces
- Testing: Cypress for E2E testing of critical healthcare workflows

### Project Structure
- `src/components/` - React components organized by feature and domain
- `src/CAREUI/` - Healthcare-specific component library
- `src/pages/` - Page-level components and routing
- `src/Utils/` - Utility functions and helpers
- `src/types/` - TypeScript type definitions for medical data
- `cypress/` - End-to-end tests for healthcare workflows

## Cross-Cutting Concerns

### Accessibility
Healthcare applications must meet enhanced accessibility standards:
- WCAG 2.1 AA compliance: Required for medical applications
- Screen reader compatibility: Medical data must be accessible via assistive technology  
- Keyboard navigation: Full keyboard support for clinical environments
- High contrast support: Visibility in various clinical lighting conditions
- Focus management: Clear focus indicators for complex medical workflows

### Internationalization
Multi-language support for global healthcare deployment:
- i18n Strings: All literal strings must use i18next
- Language files: English Locale files are in `public/locale/en.json`
- Locale files for Non-English languages should not be edited directly, Managed via Crowdin,
- Date/time formats: Localized formatting for medical timestamps

## Path-Specific Instructions
Specialized guidance automatically applied based on file paths:
- `careui.instructions.md` - Healthcare-specific component development
- `react-components.instructions.md` - React component architecture and patterns  
- `cypress-tests.instructions.md` - E2E testing for healthcare workflows
- `utils.instructions.md` - Utility function standards and medical data helpers
- `typescript-types.instructions.md` - Type definitions for medical data structures
- `pages.instructions.md` - Page component architecture and routing patterns
- `hooks.instructions.md` - Custom React hooks for healthcare workflows
- `common.instructions.md` - Core utilities, permissions, and validation
- `lib.instructions.md` - Library functions
- `providers.instructions.md` - Context providers and state management
- `context.instructions.md` - React context definitions and patterns
- `config-files.instructions.md` - Build configuration and development setup

Refer to specific instruction files in `.github/instructions/` for detailed guidance on each domain.

## Coding Standards

### Code Quality
- TypeScript: Use strict TypeScript configuration for medical data safety
- ESLint: Follow configured rules for React hooks, accessibility, and code quality
- Prettier: Consistent code formatting across the healthcare application
- Component patterns: Follow established patterns in existing codebase

### Data Handling
- Type safety: Strict typing for all medical data structures and API interfaces
- Validation: Use zod schemas for runtime validation of medical data
- Error handling: Comprehensive error boundaries and user-friendly error messages
- Logging: Appropriate logging for medical workflow debugging without exposing PHI

### Documentation Requirements
- Component documentation: Include medical use cases and accessibility notes
- API documentation: Document medical data flows and validation requirements
- Accessibility notes: Document WCAG compliance and medical device compatibility
- Medical context: Explain healthcare workflows and clinical reasoning in code comments

## Working Effectively

### Environment Setup
- Node.js 22+ is required (check `.node-version` file)
- Install Node.js 22: `curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs`
- Or use nvm: `nvm install 22 && nvm use 22`

### Bootstrap, Build, and Test the Repository
- `npm install --ignore-scripts` -- installs dependencies without Cypress binary (takes ~16 seconds)
- `npm run postinstall` -- installs platform-specific dependencies and generates headers (takes ~3 seconds)
- `npm run setup` -- generates plugin map and setup (takes ~1 second)
- `npm run build` -- production build. NEVER CANCEL: Takes 2+ minutes. Set timeout to 180+ seconds.
- `npm run dev` -- starts development server on http://localhost:4000 (takes ~5 seconds)
- `npm run preview` -- starts production preview server (requires build first)

### Linting and Formatting
- `npm run lint` -- runs ESLint. Takes 85+ seconds. Set timeout to 120+ seconds.
- `npm run lint-fix` -- runs ESLint with auto-fix
- `npm run format` -- formats code with Prettier (takes ~19 seconds)
- `npm run unimported` -- checks for unused imports (takes ~7 seconds)

### Testing
- Cypress E2E Testing:
  - `npm run cypress:install` -- FAILS due to network restrictions. Document this limitation.
  - `npm run cypress:open` -- opens Cypress UI (requires backend setup)
  - `npm run cypress:run` -- runs all tests headlessly (requires backend setup)
  - `npm run cypress:run:gui` -- runs tests in headed mode
- Testing requires local backend: Follow [CARE backend setup docs](https://github.com/ohcnetwork/care#self-hosting)
- Environment setup for testing:
  ```env
  REACT_CARE_API_URL=https://care-api.do.ohc.network
  ```

## Validation

### Manual Validation Requirements
- ALWAYS run through complete development workflow after making changes:
  1. `npm install --ignore-scripts && npm run postinstall && npm run setup`
  2. `npm run dev` -- verify development server starts and loads at http://localhost:4000
  3. `npm run build` -- NEVER CANCEL: Takes 2+ minutes
  4. `npm run preview` -- verify production build works
  5. Test basic UI functionality (login page, navigation)

  ### Build Time Expectations
  - npm install (with --ignore-scripts): up to 30 seconds
  - npm run postinstall: up to 8 seconds  
  - npm run setup: up to 3 seconds
  - npm run build: up to 3 minutes (NEVER CANCEL, Set timeout to 180+ seconds; may take longer on slower machines)
  - npm run lint: up to 2 minutes (Set timeout to 120+ seconds; allow extra time on low-resource environments)
  - npm run format: up to 40 seconds
  - npm run dev: up to 12 seconds to start server (depends on system performance)

### Required Validation Steps
- Always run `npm run format` and `npm run lint` before committing changes
- The CI pipeline (.github/workflows/linter.yml) runs `npm run lint -- --quiet` and `npm run unimported`
- Application loads successfully showing CARE healthcare facility search and login interface
- Build produces a functional PWA with service worker

## Key Dependencies & Tools

### Additional Dependencies
- @tanstack/react-query for API state management
- react-query is 
- raviger for routing
- i18next for internationalization
- date-fns for date handling
- zod for schema validation
- framer-motion for animations

### Development Tools
- ESLint 9.18.0 with TypeScript plugin
- Prettier 3.3.3 with Tailwind plugin
- Cypress 14.5.4 for E2E testing
- Vite PWA plugin for service worker

## Configuration Files & Environment
- `.env` -- environment variables (not committed)
- `.env.docker` -- Docker environment template
- `REACT_CARE_API_URL` -- backend API URL (required for full functionality)
- `care.config.ts` -- application configuration
- `vite.config.mts` -- Vite build configuration
- `tsconfig.json` -- TypeScript configuration with path aliases
- `cypress.config.ts` -- Cypress test configuration

## Common Issues and Solutions

### Known Limitations
- Cypress binary download fails in restricted environments -- this is expected and documented
- Network errors when running without backend configuration -- application still loads UI correctly
- Translation loading errors without proper backend setup -- expected behavior

### Environment Variables
- `REACT_CARE_API_URL` -- backend API endpoint (default: staging API)
- `REACT_ENABLE_HCX` -- enable HCX features
- `NODE_OPTIONS="--max-old-space-size=4096"` -- required for Docker builds

### Build Process Details
- Uses multi-stage Docker build process
- Generates PWA manifest and service worker
- Creates optimized production bundle with code splitting
- Build warnings about large chunks (>500KB) are normal

## Workflow Integration

### CI/CD Pipeline
- Linting: Runs on every PR to `develop` branch
- Cypress Tests: Runs with parallel execution and Docker backend
- Docker Build: Multi-platform builds for production
- Deployment: Automatic staging deployment on `develop` branch

### Git Workflow
- Create branches: `issues/{issue#}/{short-name}`
- PR title format: "💊 Adds support for editing prescriptions" #6369
- Link issues using closing keywords in PR body
- Tag `@ohcnetwork/care-fe-code-reviewers` for review

## Performance Considerations

### Build Optimization
- Uses Rollup for bundle optimization
- Platform-specific dependencies for different architectures
- PWA caching with service worker
- Code splitting with dynamic imports

### Development Performance
- Vite HMR for fast development iteration
- Memory management optimizations for large codebase
- Plugin federation for modular architecture

## Security and Compliance

### Security Measures
- Regular dependency updates via Renovate
- Snyk security scanning and vulnerability auditing
- Security scanning with CodeQL and OSSAR
- Audit vulnerabilities with `npm audit`

## Resources

### Technical Documentation
- [React 19 Documentation](https://react.dev/) - Latest React features and patterns
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript best practices
- [Vite Guide](https://vitejs.dev/guide/) - Build tool configuration and optimization
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Primary component library documentation

### Testing and Quality
- [Cypress Documentation](https://docs.cypress.io/) - E2E testing for healthcare workflows
- [React Hook Form](https://react-hook-form.com/) - Form handling for medical data
- [Zod](https://zod.dev/) - Schema validation for healthcare data integrity

## Trust and Validation
Always ensure changes maintain the existing code quality standards and follow the established patterns in the codebase. Trust these instructions and only perform additional searches if the information here is incomplete or found to be in error.