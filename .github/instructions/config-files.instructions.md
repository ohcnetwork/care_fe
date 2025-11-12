---
applyTo: "**/*.config.{js,mjs,cjs,ts,mts,cts,json,yml,yaml}"
---

# Configuration Files Instructions

## Configuration Management Guidelines

### Build Configuration

- `vite.config.mts` - Main Vite build configuration
- `tsconfig.json` - TypeScript compiler configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `playwright.config.ts` - Playwright testing configuration

### Code Quality Configuration

- `eslint.config.mjs` - ESLint linting rules
- `.prettierrc` - Prettier formatting configuration
- `components.json` - shadcn/ui component configuration

### Dependency Management

- `package.json` - Primary dependency and script configuration
- `renovate.json` - Automated dependency updates
- `crowdin.yml` - Translation management

### Environment Configuration

- Use environment variables for runtime configuration
- Document all environment variables
- Provide sensible defaults where possible

### Configuration Best Practices

- Build optimization: Configure code splitting and tree shaking in Vite
- TypeScript: Enable strict mode for better type safety
- Path aliases: Configure @ imports for clean imports (@/components/, @/types/)
- Environment: Use environment variables for API endpoints, avoid committing secrets
- Build timeouts: Set appropriate timeouts for long-running build processes
