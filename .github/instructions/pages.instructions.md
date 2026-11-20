---
applyTo: "src/pages/**/*.{ts,tsx}"
---

# Page Components Instructions

## Page Architecture Guidelines

### File Structure and Naming
- Keep page components in `src/pages/` organized by feature
- Use descriptive file names that reflect the page purpose
- Export page components as default exports
- Co-locate page-specific components and utilities

### Routing Integration
- Use `raviger` router for navigation (existing dependency)
- Implement proper route parameters and query string handling
- Handle navigation guards and authentication checks
- Use consistent URL patterns across the application

### Layout and Structure
- Use consistent page layouts and structure
- Implement proper loading states and error boundaries
- Handle responsive design considerations
- Use semantic HTML structure for accessibility

### Data Fetching
- Use `@tanstack/react-query` for API state management (existing dependency)
- Implement proper loading, error, and success states
- Handle pagination and infinite scroll patterns
- Cache data appropriately based on usage patterns

### Form Handling
- Use controlled components for form inputs
- Implement proper form validation with `zod` schemas
- Handle form submission states (loading, success, error)
- Provide clear user feedback for form actions

### State Management
- Use React hooks for local page state
- Integrate with global state management patterns
- Handle complex state transitions properly
- Minimize unnecessary re-renders

### Authentication and Authorization
- Implement proper authentication checks
- Handle different user roles and permissions
- Redirect to login when authentication is required
- Show appropriate UI based on user permissions

### SEO and Meta Information
- Set appropriate page titles and meta descriptions
- Handle OpenGraph and Twitter card meta tags
- Implement structured data where applicable
- Consider PWA manifest requirements

### Performance Optimization
- Implement code splitting for large pages
- Use lazy loading for heavy components
- Optimize bundle size with proper imports
- Handle image optimization and lazy loading

### Error Handling
- Implement comprehensive error boundaries
- Handle API errors gracefully
- Provide meaningful error messages to users
- Include error reporting and logging

### Internationalization (i18n)
- Use `i18next` for text translations (existing dependency)
- Handle dynamic content translation
- Support RTL languages if applicable
- Format dates, numbers, and currencies appropriately

### Accessibility Guidelines
- Implement proper heading hierarchy (h1, h2, h3, etc.)
- Ensure keyboard navigation works properly
- Provide skip links for screen readers
- Use proper ARIA labels and roles
- Handle focus management for dynamic content

### Testing Considerations
- Structure pages to be easily testable
- Add appropriate `data-cy` attributes for E2E tests
- Separate business logic from presentation logic
- Mock external dependencies in tests

### Healthcare Domain Specific
- Handle patient data with appropriate privacy considerations
- Implement proper data validation for medical information
- Follow healthcare compliance requirements
- Handle emergency and critical care scenarios appropriately