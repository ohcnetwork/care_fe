# Project Structure

This React TypeScript application follows a modular architecture with clear separation of concerns.

## Main Entry Points
- [src/index.tsx](mdc:src/index.tsx) - Application bootstrap
- [src/App.tsx](mdc:src/App.tsx) - Root component
- [src/vite.config.mts](mdc:vite.config.mts) - Vite configuration

## Key Directories
- `src/components/` - Reusable UI components
- `src/components/ui/` - ShadCN UI components
- `src/pages/` - Page components and routes
- `src/Utils/` - Utility functions and helpers
- `src/hooks/` - Custom React hooks
- `src/context/` - React context providers
- `src/types/` - TypeScript type definitions and typed API definitions
- `src/Locale/` - Internationalization files
- `src/CAREUI/` - Custom UI component library

## Configuration Files
- [tailwind.config.js](mdc:tailwind.config.js) - Tailwind CSS configuration
- [tsconfig.json](mdc:tsconfig.json) - TypeScript configuration
- [components.json](mdc:components.json) - Shadcn UI configuration

# Coding Standards

## TypeScript Guidelines
- Use TypeScript for all new code
- Prefer interfaces over types for object definitions
- Use functional components with proper type definitions
- Avoid using `any` type; use proper type definitions
- Use type inference where possible

## Component Structure
- One component per file is preferred. 
- Prefer default exports for components
- Follow the component naming pattern: `ComponentName.tsx`
- Place components in appropriate feature directories
- Keep components small and focused

## Styling Guidelines
- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Use Shadcn UI components when available

## State Management
- Use TanStack Query for API data management
- Prefer React Context for global state
- Use local state for component-specific data

## File Naming
- Use kebab-case for directories: `auth-wizard/`
- Use PascalCase for component files: `AuthWizard.tsx`
- Use camelCase for utility files: `useAuth.ts`

## Testing
- Write tests in Cypress for E2E testing
- Follow testing guidelines in `cypress/docs/`
- Test components in isolation
- Write meaningful test descriptions

# Data Fetching and API Guidelines

## TanStack Query Usage

- Use TanStack Query with the `query` and `mutate` utilities from `@/Utils/request/`
- Use appropriate query keys following the resource pattern
- Leverage built-in features for pagination and debouncing
- Implement proper error handling using the global error handler

## API Route Definitions

### Modern Route Pattern

Routes are defined in dedicated API files (`*Api.ts`) within the corresponding type directory:

```typescript
// src/types/user/userApi.ts
export default {
  list: {
    path: "/api/v1/users/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<UserReadMinimal>>(),
  },
  create: {
    path: "/api/v1/users/",
    method: HttpMethod.POST,
    TRes: Type<UserReadMinimal>(),
    TBody: Type<UserCreate>(),
  },
} as const;

// src/types/facility/facilityApi.ts
export default {
  getFacility: {
    path: "/api/v1/facility/{id}/",
    method: HttpMethod.GET,
    TRes: Type<FacilityRead>(),
  },
  updateMonetaryComponents: {
    path: "/api/v1/facility/{facilityId}/set_monetary_codes/",
    method: HttpMethod.POST,
    TRes: Type<FacilityRead>(),
    TBody: Type<{
      discount_codes: Code[];
      discount_monetary_components: MonetaryComponentRead[];
    }>(),
  },
} as const;
```

### Legacy Route Pattern

Legacy routes are defined in `src/Utils/api.tsx`:

```typescript
export const routes = {
  auth: {
    login: {
      path: "/api/v1/auth/login/",
      method: "POST",
    } as ApiRoute<LoginResponse, never, LoginData>,
    logout: {
      path: "/api/v1/auth/logout/",
      method: "POST",
    } as ApiRoute<void>,
  },
} as const;
```

## Query Patterns

### Basic Queries

```typescript
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: query(userApi.list)
});
```

### With Parameters

```typescript
// Path parameters
const { data } = useQuery({
  queryKey: ['user', username],
  queryFn: query(userApi.get, {
    pathParams: { username }
  })
});

// Query parameters
const { data } = useQuery({
  queryKey: ['facilities', searchTerm],
  queryFn: query(facilityApi.getAllFacilities, {
    queryParams: { search: searchTerm }
  })
});
```

## Mutation Patterns

```typescript
const { mutate: createUser } = useMutation({
  mutationFn: mutate(userApi.create),
  onSuccess: () => {
    queryClient.invalidateQueries(["users"]);
  },
});
```

## Error Handling

- Errors are handled globally by default
- Common scenarios are automatically handled:
  - Session expiry → Redirects to /session-expired
  - Bad requests (400/406) → Shows error notification
- Use `silent: true` option to suppress error notifications
- Custom error handling can be implemented using `onError` callbacks


# UI Component Guidelines

## Component Library Usage
- Use Shadcn UI components as the primary component library
- NEVER modify the shadcn component files directly in `components/ui/*`
- Follow the component documentation for proper usage
- Customize components using Tailwind CSS
- Maintain consistent styling across components

## Routing with Raviger

### Route Definition
```typescript
// src/Routers/routes/FacilityRoutes.tsx
const FacilityRoutes: AppRoutes = {
  "/facility/:facilityId/overview": ({ facilityId }) => (
    <FacilityOverview facilityId={facilityId} />
  ),
  "/facility/:facilityId/services/:serviceId": ({ facilityId, serviceId }) => (
    <HealthcareServiceShow facilityId={facilityId} serviceId={serviceId} />
  )
};

// Type-safe route parameters
type RouteParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? { [_ in Param | keyof RouteParams<Rest>]: string }
    : T extends `${string}:${infer Param}`
      ? { [_ in Param]: string }
      : Record<string, never>;
```

### Navigation and Hooks
```typescript
// Navigation
import { navigate, useRedirect } from "raviger";

// Redirect from old to new route
useRedirect("/user", "/users");

// Programmatic navigation
navigate(`/facility/${facilityId}/services`);

// Route matching
const routes = useRoutes(Routes);
```

### Route Organization
- Define routes in dedicated files under `src/Routers/routes/`
- Group related routes in feature-specific files (e.g., `FacilityRoutes.tsx`)
- Combine routes in `AppRouter.tsx`
- Use proper typing with `AppRoutes` type
- Support plugin routes through `usePluginRoutes` hook

### Layout and Navigation
```typescript
// Conditional sidebar rendering
const PATHS_WITHOUT_SIDEBAR = [
  "/",
  "/session-expired",
  /^\/facility\/[^/]+\/services_requests\/[^/]+$/,
];

// Route wrapper with error boundary
<ErrorBoundary fallback={<ErrorPage />}>
  {routes}
</ErrorBoundary>
```

## Responsive Design
- Use Tailwind's responsive classes
- Follow mobile-first approach
- Test components across different screen sizes
- Use proper breakpoints as defined in `tailwind.config.js`

## Accessibility
- Implement proper ARIA attributes
- Ensure keyboard navigation works
- Maintain proper color contrast
- Support screen readers
- Test with accessibility tools

## Component Structure
```typescript
// Example component structure
interface ComponentProps {
  title: string;
  onAction: () => void;
}

export function Component({ title, onAction }: ComponentProps) {
  const [state, setState] = useState(false);
  
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <Button onClick={onAction}>
        Action
      </Button>
    </div>
  );
}
```

## Internationalization
- Use translation keys from `src/Locale/`
- Support RTL languages
- Use proper date/time formatting
- Support multiple languages
