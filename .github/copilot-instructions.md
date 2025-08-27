# CARE Frontend

CARE is a Digital Public Good enabling TeleICU & Decentralised Administration of Healthcare Capacity across States. This is a React + TypeScript + Vite frontend application for the healthcare management system.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Environment Setup
- **Node.js 22+** is required (check `.node-version` file)
- Install Node.js 22: `curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs`
- Or use nvm: `nvm install 22 && nvm use 22`

### Bootstrap, Build, and Test the Repository
- `npm install --ignore-scripts` -- installs dependencies without Cypress binary (takes ~16 seconds)
- `npm run postinstall` -- installs platform-specific dependencies and generates headers (takes ~3 seconds)
- `npm run setup` -- generates plugin map and setup (takes ~1 second)
- `npm run build` -- production build. **NEVER CANCEL: Takes 2+ minutes. Set timeout to 180+ seconds.**
- `npm run dev` -- starts development server on http://localhost:4000 (takes ~5 seconds)
- `npm run preview` -- starts production preview server (requires build first)

### Linting and Formatting
- `npm run lint` -- runs ESLint. **Takes 85+ seconds. Set timeout to 120+ seconds.**
- `npm run lint-fix` -- runs ESLint with auto-fix
- `npm run format` -- formats code with Prettier (takes ~19 seconds)
- `npm run unimported` -- checks for unused imports (takes ~7 seconds)

### Testing
- **Cypress E2E Testing:**
  - `npm run cypress:install` -- **FAILS due to network restrictions. Document this limitation.**
  - `npm run cypress:open` -- opens Cypress UI (requires backend setup)
  - `npm run cypress:run` -- runs all tests headlessly (requires backend setup)
  - `npm run cypress:run:gui` -- runs tests in headed mode
- **Testing requires local backend:** Follow [CARE backend setup docs](https://github.com/ohcnetwork/care#self-hosting)
- **Environment setup for testing:**
  ```env
  REACT_CARE_API_URL=http://127.0.0.1:9000
  ```

## Validation

### Manual Validation Requirements
- **ALWAYS run through complete development workflow after making changes:**
  1. `npm install --ignore-scripts && npm run postinstall && npm run setup`
  2. `npm run dev` -- verify development server starts and loads at http://localhost:4000
  3. `npm run build` -- **NEVER CANCEL: Takes 2+ minutes**
  4. `npm run preview` -- verify production build works
  5. Test basic UI functionality (login page, navigation)

### Build Time Expectations
- **npm install (with --ignore-scripts):** ~16 seconds
- **npm run postinstall:** ~3 seconds  
- **npm run setup:** ~1 second
- **npm run build:** ~2 minutes 11 seconds -- **NEVER CANCEL, Set timeout to 180+ seconds**
- **npm run lint:** ~1 minute 25 seconds -- **Set timeout to 120+ seconds**
- **npm run format:** ~19 seconds
- **npm run dev:** ~5 seconds to start server

### Required Validation Steps
- Always run `npm run format` and `npm run lint` before committing changes
- The CI pipeline (.github/workflows/linter.yml) runs `npm run lint -- --quiet` and `npm run unimported`
- Application loads successfully showing CARE healthcare facility search and login interface
- Build produces a functional PWA with service worker

## Technology Stack

### Core Technologies
- **React 19.1.1** with TypeScript
- **Vite 6.3.5** for build tooling
- **Tailwind CSS 4.1.3** for styling
- **Node.js 22+** (required by package.json engines field)

### Key Dependencies
- **@tanstack/react-query** for API state management
- **raviger** for routing (note: uses deprecated `routes` API)
- **i18next** for internationalization
- **date-fns** for date handling
- **zod** for schema validation
- **framer-motion** for animations

### Development Tools
- **ESLint 9.18.0** with TypeScript plugin
- **Prettier 3.3.3** with Tailwind plugin
- **Cypress 14.5.4** for E2E testing
- **Vite PWA plugin** for service worker

## Project Structure

### Key Directories
- `src/` -- main source code
  - `components/` -- React components organized by feature
  - `pages/` -- page-level components
  - `Utils/` -- utility functions and helpers
  - `types/` -- TypeScript type definitions
  - `CAREUI/` -- custom UI component library
  - `Locale/` -- internationalization files
- `cypress/` -- E2E test files and configuration
- `public/` -- static assets
- `scripts/` -- build and setup scripts

### Important Files
- `package.json` -- dependencies and scripts
- `care.config.ts` -- application configuration
- `vite.config.mts` -- Vite build configuration
- `tsconfig.json` -- TypeScript configuration with path aliases
- `cypress.config.ts` -- Cypress test configuration
- `CLAUDE.md` -- Additional developer guidance

### Configuration Files
- `.env` -- environment variables (not committed)
- `.env.docker` -- Docker environment template
- `REACT_CARE_API_URL` -- backend API URL (required for full functionality)

## Common Issues and Solutions

### Known Limitations
- **Cypress binary download fails** in restricted environments -- this is expected and documented
- **Network errors** when running without backend configuration -- application still loads UI correctly
- **Translation loading errors** without proper backend setup -- expected behavior

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
- **Linting:** Runs on every PR to `develop` branch
- **Cypress Tests:** Runs with parallel execution and Docker backend
- **Docker Build:** Multi-platform builds for production
- **Deployment:** Automatic staging deployment on `develop` branch

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

### Code Quality
- Strict TypeScript configuration
- ESLint rules for React hooks and accessibility
- Prettier for consistent formatting
- Security scanning with CodeQL and OSSAR

### Dependencies
- Regular dependency updates via Renovate
- Snyk security scanning
- Audit vulnerabilities with `npm audit`

Always ensure changes maintain the existing code quality standards and follow the established patterns in the codebase.