---
applyTo: "cypress/e2e/**/*.cy.{ts,js}"
---

# Cypress E2E Testing Instructions

## Test File Organization (cypress/e2e/)
- dashboard_spec/: Dashboard navigation, facility overview, patient census tests
- facility_spec/: Facility management, bed allocation, staff assignment workflows
- patient_spec/: Patient admission, discharge, medical records, consultation flows
- login_spec/: Authentication flows, user roles (doctor, nurse, admin), session management
- resources_spec/: Asset management, inventory tracking, equipment allocation
- users_spec/: User management, role assignments, permission testing

## Page Object Model (cypress/pageObject/)
- Structure: auth/, dashboard/, facility/, Patients/, resources/, Users/ directories
- Naming: Use PascalCase for classes (e.g., `PatientPage`, `FacilityDashboard`)
- Methods: Action methods (clickSubmit, enterPatientData) and assertion methods (verifyPatientAdmitted)
- Selectors: Store all selectors as private properties, use data-cy attributes

## Healthcare-Specific Test Patterns
```typescript
// Example patient admission flow
cy.get('[data-cy="patient-admission-form"]')
  .within(() => {
    cy.get('[data-cy="patient-name"]').type('John Doe');
    cy.get('[data-cy="patient-age"]').type('45');
    cy.get('[data-cy="medical-history"]').type('Diabetes, Hypertension');
  });
```

## API Intercept Patterns for CARE Backend
- Authentication: `cy.intercept('POST', '/api/v1/auth/login/')`
- Patient APIs: `cy.intercept('GET', '/api/v1/patient/**')`
- Facility APIs: `cy.intercept('GET', '/api/v1/facility/**')`
- Consultation APIs: `cy.intercept('POST', '/api/v1/consultation/')`
- File uploads: `cy.intercept('POST', '/api/v1/files/')`

## Test Data Management (cypress/fixtures/)
- users.json: Test user accounts with different roles (doctor, nurse, admin)
- facilities.json: Hospital/clinic test data with bed configurations
- patients.json: Mock patient records with PHI-safe data
- sample files: avatar.jpg, sample_file.xlsx, sample_img1.png for upload testing

## Custom Commands (cypress/support/commands.ts)
- Authentication: `cy.login(userType)` - Login as doctor/nurse/admin
- Patient operations: `cy.createPatient(patientData)`, `cy.admitPatient()`
- Facility setup: `cy.selectFacility(facilityName)`, `cy.checkBedAvailability()`
- File operations: `cy.uploadMedicalFile(fileName)`

## Environment Configuration
- Local testing: `REACT_CARE_API_URL=http://127.0.0.1:9000`
- Staging: Use staging backend URL from environment variables
- Timeouts: Set `defaultCommandTimeout: 10000` for API-heavy healthcare workflows
- Viewport: Use `cypress/utils/viewPort.ts` for mobile/tablet/desktop medical device testing

## Critical Healthcare Test Flows
1. Patient Admission: Registration → Medical history → Bed assignment → Consultation
2. Emergency workflow: Triage → Priority assignment → Doctor notification → Treatment
3. Discharge process: Medical clearance → Billing → Medication instructions → Follow-up
4. Shift handover: Patient status → Medication schedule → Critical alerts
5. Inventory management: Medicine stock → Equipment availability → Supply ordering

## Data Privacy & Security Testing
- PHI protection: Verify patient data masking in logs and screenshots
- Access control: Test role-based permissions (doctor vs nurse vs admin)
- Session security: Verify automatic logout, session timeout
- Audit trails: Verify medical record access logging

## Error Scenarios (Critical for Healthcare)
- Network failures: Test offline mode, connection drops during critical operations
- Invalid medical data: Test validation for vital signs, medication dosages
- Authorization errors: Test expired sessions during patient care
- System overload: Test high patient volume scenarios

## Performance Testing for Clinical Environments
- Page load times: Critical for emergency situations (<3 seconds)
- Large patient lists: Test pagination, infinite scroll with 1000+ patients
- Real-time updates: Test patient status changes, bed availability updates
- Mobile performance: Test on tablets used at bedside

## CI/CD Integration (.github/workflows/cypress.yaml)
- Parallel execution: Tests split across multiple runners for faster feedback
- Docker backend: Full CARE backend stack for integration testing
- Test artifacts: Screenshots and videos for failed healthcare workflows
- Staging deployment: Automatic testing on staging environment