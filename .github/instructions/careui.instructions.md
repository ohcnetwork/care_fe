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
Medical applications require enhanced accessibility for clinical environments:
- Screen reader support: All medical data must be accessible via assistive technology
- Keyboard navigation: Full keyboard support for hands-free operation in clinical settings
- High contrast mode: Support system-level high contrast preferences
- Focus management: Clear, visible focus indicators for complex medical workflows
- ARIA labels: Comprehensive labeling for medical context and urgency

### Clinical Environment Styling
- Color conventions: Follow medical standards (red=critical, yellow=warning, green=stable)
- High contrast: Ensure visibility in varied clinical lighting conditions
- Touch targets: Minimum 44px for mobile medical devices and touch screens
- Print compatibility: Medical forms and reports must render correctly in print media
- Performance: Sub-100ms response times for emergency medical workflows

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
- Medical APIs: Components should integrate cleanly with healthcare data sources
- FHIR compatibility: Support healthcare data standards where applicable
- Real-time updates: Support live data updates for critical medical information
- Offline resilience: Core functionality should work without network connectivity

## Development Guidelines

### Component Development
- Composition over inheritance: Prefer composable patterns for medical workflow flexibility
- Error boundaries: Implement proper error handling for critical medical data
- Testing: Comprehensive testing including accessibility and medical workflow scenarios
- Documentation: Include medical use cases and clinical context in component documentation

### Performance Requirements
- Rendering performance: Target sub-100ms response times for emergency workflows
- Memory efficiency: Optimize for long-running clinical applications
- Bundle impact: Minimize bundle size impact on hospital network infrastructure
- Progressive enhancement: Ensure core functionality works on older medical devices

### Code Quality
- TypeScript: Use strict TypeScript for medical data safety
- Accessibility testing: Include automated accessibility testing in CI/CD
- Medical validation: Implement appropriate validation for clinical data inputs
- Error handling: Robust error handling with user-friendly medical context