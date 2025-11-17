---
applyTo: "src/CAREUI/**/*.{ts,tsx}"
---

# CAREUI Component Library Instructions

## Overview
CAREUI is a healthcare-specific component library within the CARE frontend application. It provides specialized UI components for medical workflows while working alongside shadcn/ui as the primary design system.

**Architecture**: CAREUI (`src/CAREUI/`) contains medical-specific components, while shadcn/ui (`src/components/ui/`) provides standard UI components.

## Component Categories

### Interactive Components
Healthcare-specific user interactions requiring specialized behavior:
- Medical scheduling components: Appointment booking, shift management, medication timing
- Medical input controls: Specialized form controls for clinical data entry
- Medical navigation: Healthcare workflow-specific navigation patterns

### Display Components  
Healthcare-specific information presentation:
- Medical indicators: Status displays, alert badges, progress indicators
- Medical data visualization: Charts, graphs, medical metrics display
- Medical formatting: Specialized formatting for clinical data

### Medical Imaging Components
Specialized components for medical imagery:
- Image viewers: Medical scan viewing with zoom, pan, and annotation
- Image controls: Zoom, rotation, contrast adjustment for medical imagery
- Image annotations: Markup tools for medical image analysis

## Architecture Principles

### Integration Patterns
CAREUI components should integrate seamlessly with the broader application:
- Composability: Accept shadcn/ui components as children when appropriate
- Consistency: Follow established patterns from shadcn/ui for props and styling
- Extensibility: Support customization through standard React patterns

### Import Patterns
```typescript
// CAREUI imports - use for medical-specific functionality
import { ComponentName } from "@/CAREUI/category/ComponentName";

// shadcn/ui imports - use for standard UI elements  
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
```

### Decision Matrix: CAREUI vs shadcn/ui
- Use CAREUI: Medical-specific interactions, healthcare workflows, clinical data presentation
- Use shadcn/ui: Standard UI components (buttons, forms, modals, tables, navigation)
- Integration: CAREUI components should accept shadcn/ui components as children when logical

## Healthcare Design Requirements

### Accessibility
- Screen reader support for all medical data
- Full keyboard navigation
- High contrast mode support
- Clear focus indicators
- Comprehensive ARIA labels for medical context

### Clinical Environment Styling
- Follow medical color standards (red=critical, yellow=warning, green=stable)
- Ensure high contrast for clinical lighting
- Minimum 44px touch targets for mobile devices
- Support print media for medical forms

### Component Interface Patterns
Healthcare components should follow consistent prop patterns:
```typescript
// Standard medical component interface
interface MedicalComponentProps {
  // Medical context for proper behavior
  medicalContext?: 'emergency' | 'routine' | 'critical';
  
  // Accessibility requirements
  ariaLabel?: string;
  screenReaderText?: string;
  
  // Clinical validation
  onValidationError?: (error: MedicalValidationError) => void;
  
  // Integration with medical data
  patientId?: string;
  facilityId?: string;
}
```

## Integration Requirements

### State Management
- React Query: Integrate with medical API endpoints for real-time data
- Form libraries: Full compatibility with react-hook-form for medical data collection
- Validation: Support zod schemas for medical data validation and FHIR compliance

### Data Integration
- Integrate with React Query for medical APIs
- Support real-time updates for critical information
- Handle offline scenarios gracefully

## Development Guidelines

- Prefer composition over inheritance
- Use strict TypeScript
- Implement error boundaries for medical data
- Include medical use cases in documentation
- Target sub-100ms response for emergency workflows
- Test accessibility thoroughly
