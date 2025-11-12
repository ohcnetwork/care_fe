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
- Use `raviger` for navigation
- Handle route parameters and query strings properly
- Implement authentication guards where needed
- Maintain consistent URL patterns

### Layout and Structure
- Use consistent page layouts
- Implement loading states and error boundaries
- Use semantic HTML for accessibility
- Handle responsive design with Tailwind breakpoints

### Data Fetching
- Use `@tanstack/react-query` for API state
- Implement loading, error, and success states
- Handle pagination patterns appropriately
- Cache data based on usage

### Form Handling
- Use `react-hook-form` with `zod` validation
- Handle submission states clearly
- Provide user feedback for actions

### State Management
- Use React hooks for local state
- Use Jotai atoms for shared UI state
- Minimize unnecessary re-renders

### Authentication
- Check authentication state appropriately
- Handle user roles and permissions
- Redirect to login when needed

### SEO and Meta
- Set appropriate page titles and meta descriptions
- Consider PWA manifest requirements for healthcare app

### Performance
- Use code splitting for large pages
- Lazy load heavy components
- Optimize imports to reduce bundle size

### Error Handling
- Use error boundaries for page-level errors
- Handle API errors gracefully
- Provide clear error messages

### Internationalization
- Use `i18next` for all user-facing text
- Format dates with `date-fns` locale support

### Accessibility
- Use proper heading hierarchy (h1, h2, h3)
- Ensure keyboard navigation works
- Use ARIA labels and roles appropriately
- Manage focus for dynamic content

### Testing
- Structure pages for easy testing with Playwright
- Use semantic HTML for natural test selectors
- Separate business logic from presentation
- Mock external dependencies appropriately

### Healthcare Domain Specific
- Handle patient data with appropriate privacy considerations
- Implement proper data validation for medical information
- Follow healthcare compliance requirements
- Handle emergency and critical care scenarios appropriately