---
applyTo: "src/components/**/*.{ts,tsx}"
---

# React Components Instructions

## Import Path Conventions
- Use path aliases: `@/components/`, `@/types/`, `@/lib/`, `@/pages/`
- Import order: External packages → `@/components/ui/` → `@/components/` → `@/CAREUI/` → `@/types/` → `@/lib/` → relative imports
- Use named exports from `lucide-react` for icons (e.g., `import { SettingsIcon } from "lucide-react"`)
- Import `useTranslation` from `react-i18next` for internationalization

## Component Architecture Patterns
- Healthcare domain: Feature-based organization - Components grouped by Patient/, Facility/, Medication/, etc.
- React 19.1.1 hooks: Functional components only - Use React 19.1.1 hooks pattern
- TypeScript interfaces: Props interfaces - Always define PatientInfoCardProps, etc.
- Handle prefix: Event handlers - handleSubmit, handleTagsUpdate, handlePatientSelect

## UI Component System
- shadcn/ui components: Primary UI - Button, Card, Badge, etc. from `@/components/ui/`
- Healthcare-specific: CAREUI custom - Calendar, WeekdayCheckbox, Zoom from `@/CAREUI/`
- Button variants: Use `buttonVariants` from `@/components/ui/button` with CVA patterns
- Card structure: Follow `<Card><CardHeader>` pattern for consistent layouts

## Healthcare-Specific Patterns
- Patient data: Use `PatientRead` type from `@/types/emr/patient/patient`
- Tag system: Implement `TagAssignmentSheet` with `TagEntityType` for patient/facility tags
- Hover cards: Use `PatientHoverCard` for patient info overlays
- Badge usage: Display patient status, facility capacity, medication dosage with color variants

## Patient Name Display
Whenever a patient name (`patient.name` from `PatientRead`) is rendered to the user, it MUST appear in title case (first letter of each word capitalized). Apply this consistently everywhere patient names surface.
- Preferred: add the Tailwind `capitalize` class to the element that renders the name, e.g. `<span className="capitalize">{patient.name}</span>` or `className="capitalize"` on the existing rendering element. This handles casing via CSS and keeps the stored value untouched.
- Titles/strings: when a name is embedded in a value that can't take a CSS class (page/print titles, `document.title`, template strings), build the title as a `ReactNode` and wrap only the name in `<span className="capitalize">{patient.name}</span>`. Title props such as `PrintPreview`/`Page`/`PageTitle` `title` accept `ReactNode` for exactly this reason.
- Do NOT mutate or pre-transform the stored name for display (avoid ad-hoc `toUpperCase()`/`properCase()` on patient names) — rely on the `capitalize` class so the underlying data stays intact.
- `patient.name` is a single free-text field. For user/practitioner names (first/last name objects) use `formatName()` from `@/Utils/utils`, not this rule.

## Styling with Tailwind CSS 4.1.3
- Class variance authority: Use `cva()` for variant-based component styling
- Utility function: Use `cn()` from `@/lib/utils` for conditional classes
- Color system: Follow primary-700, gray-900, red-500 pattern with dark mode variants
- Shadow system: Use shadow-sm, shadow-xs for elevation
- Focus states: Include `focus-visible:ring-1` and `focus-visible:outline-hidden`

## State Management Integration
- Server state: React Query - Use `@tanstack/react-query` for facility data, patient records
- UI state: Local state - useState for UI state, useCallback for event handlers
- Controlled inputs: Form state - Handle controlled inputs with proper TypeScript typing
- Async operations: Loading states - Implement loading, error, and success states

## Internationalization (i18n)
- Translation hook: Use `const { t } = useTranslation()` pattern
- Text content: Wrap all user-facing text in `t("key.path")`
- Healthcare terminology: Use consistent medical term translations
- Date formatting: Use `date-fns` with locale support for medical timestamps

## Accessibility for Healthcare
- ARIA labels: Critical for medical data (patient names, vital signs, medication alerts)
- Keyboard navigation: Essential for clinical workflows and emergency situations
- Screen reader support: Proper heading hierarchy for medical records
- Color contrast: Meet WCAG AA standards for clinical environments