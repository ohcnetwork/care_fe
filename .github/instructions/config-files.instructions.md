---
applyTo: "**/*.config.{js,mjs,cjs,ts,mts,cts,json,yml,yaml}"
---

# Configuration Files Instructions

## Configuration Management Guidelines

### Build Configuration
- `vite.config.mts` - Main Vite build configuration
- `tsconfig.json` - TypeScript compiler configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `cypress.config.ts` - Cypress testing configuration

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

### Build Optimization
- Configure code splitting and lazy loading where applicable
- Optimize bundle size with proper tree shaking
- Set up proper caching strategies
- Configure PWA settings appropriately

### Development Experience
- Configure hot module replacement for fast development
- Set up proper source mapping for debugging
- Configure path aliases for clean imports
- Enable TypeScript strict mode for better code quality

### CI/CD Integration
- Ensure configurations work in CI/CD environments
- Set appropriate timeouts for long-running processes
- Configure proper caching for faster builds
- Handle different environment configurations

### Security Considerations
- Avoid committing sensitive configuration values
- Use environment variables for API endpoints

### Performance Monitoring
- Configure bundle analysis tools
- Set up performance budgets
- Track bundle size changes over time