---
applyTo: "src/CAREUI/**/*.{ts,tsx}"
---

# CAREUI Component Library Instructions

## Current CAREUI Structure (Limited Scope)
- **src/CAREUI/interactive/**: Calendar.tsx, WeekdayCheckbox.tsx, Zoom.tsx (3 components)
- **src/CAREUI/display/**: Callout.tsx, ColoredIndicator.tsx, FilterBadge.tsx (3 components)
- **src/CAREUI/icons/**: CareIcon.tsx, CustomIcons.tsx, DuoTonePaths.json, UniconPaths.json, icon.css
- **src/CAREUI/misc/**: PrintPreview.tsx (1 component)

**NOTE**: Primary UI system is shadcn/ui in `src/components/ui/`, not CAREUI

## Calendar Component (src/CAREUI/interactive/Calendar.tsx)
- **Medical scheduling**: Appointment booking, shift scheduling, medication timing
- **Integration**: Must work with `date-fns` for date manipulation
- **Accessibility**: ARIA labels for screen readers in clinical settings
- **Mobile support**: Touch-friendly for tablet use at bedside

## WeekdayCheckbox Component (src/CAREUI/interactive/WeekdayCheckbox.tsx)  
- **Medical scheduling**: Weekly medication schedules, recurring appointments
- **Day representation**: Sunday=0 to Saturday=6 (medical standard)
- **State management**: Controlled component with array of selected days
- **Validation**: Ensure at least one day selected for medical regimens

## Zoom Component (src/CAREUI/interactive/Zoom.tsx)
- **Medical imaging**: X-rays, MRI scans, patient photos
- **Zoom controls**: Pinch-to-zoom on mobile, scroll wheel on desktop
- **Performance**: Efficient rendering for large medical images
- **Accessibility**: Keyboard navigation for zoom levels

## Import Patterns for CAREUI
```typescript
// Correct imports from CAREUI
import { Calendar } from "@/CAREUI/interactive/Calendar";
import { WeekdayCheckbox } from "@/CAREUI/interactive/WeekdayCheckbox";
import { Zoom } from "@/CAREUI/interactive/Zoom";

// Use shadcn/ui for primary components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
```

## CAREUI vs shadcn/ui Decision Matrix
- **Use CAREUI**: Medical-specific interactions (calendar scheduling, image zoom)
- **Use shadcn/ui**: Standard UI components (buttons, forms, modals, tables)
- **Integration**: CAREUI components should accept shadcn/ui components as children

## Healthcare-Specific Styling
- **Color coding**: Use medical color conventions (red=critical, yellow=warning, green=stable)
- **High contrast**: Essential for clinical environments with poor lighting
- **Large touch targets**: 44px minimum for mobile medical devices
- **Print support**: Medical forms and reports must print correctly

## Component Props Patterns
```typescript
interface CalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date; // Prevent scheduling in past
  maxDate?: Date; // Limit future scheduling
  disabledDates?: Date[]; // Hospital holidays, staff unavailable
  medicalContext?: 'appointment' | 'medication' | 'shift';
}
```

## State Management Integration
- **React Query**: Integration with appointment/schedule APIs
- **Form libraries**: Compatible with react-hook-form for medical forms
- **Validation**: Integration with zod schemas for medical data validation

## Accessibility for Medical Devices
- **Screen reader support**: Medical data must be accessible
- **Keyboard navigation**: Critical for hands-free operation
- **High contrast mode**: Support Windows high contrast for visual impairments
- **Focus management**: Clear focus indicators for clinical workflows

## Performance for Clinical Environment
- **Fast rendering**: Sub-100ms response for emergency situations
- **Memory efficiency**: Long-running applications in hospital systems
- **Bundle size**: Minimize impact on slow hospital networks
- **Offline support**: Critical components must work without internet