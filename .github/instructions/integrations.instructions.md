---
applyTo: "src/Integrations/**/*.{ts,tsx}"
---

# Third-Party Integrations Instructions

## Healthcare Integration Architecture

### Error Monitoring (`Sentry.tsx`)
- Medical error tracking for clinical workflow failures
- PHI-safe error reporting without exposing protected health information  
- Performance monitoring for critical healthcare applications
- Alert escalation for system failures affecting patient care

### CARE Project Integration Example
```typescript
// Healthcare-specific Sentry configuration
export const initializeMedicalSentry = () => {
  Sentry.init({
    dsn: careConfig.sentry.dsn,
    environment: careConfig.sentry.environment,
    beforeSend(event) {
      return sanitizeMedicalData(event); // Remove PHI
    },
    tracesSampleRate: 0.8, // Higher rate for medical apps
  });
};
```

## Integration Guidelines

### Healthcare System Integrations
- FHIR resource handling: Standardized healthcare data exchange
- Laboratory systems: Lab order management and result processing
- Pharmacy systems: Electronic prescription and medication management
- Medical devices: Real-time monitoring and data collection

### Security & Compliance
- Implement PHI protection in all integrations
- Log all medical data access for audit trails
- Use encrypted communication for healthcare data
- Handle authentication and authorization properly

### Error Handling
- Sanitize error messages to prevent PHI exposure
- Implement fallback procedures for critical workflows
- Monitor integration health and performance
- Provide user-friendly error messages

### Testing & Monitoring
- Test integration failures and recovery scenarios
- Monitor response times for critical healthcare services
- Validate data consistency across integrated systems
- Implement proper logging without exposing sensitive data