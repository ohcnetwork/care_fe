---
applyTo: "tests/**/*.{ts,js}"
---

# Playwright E2E Testing Instructions

## Test File Organization (tests/)

- admin/: Admin functionality, user management, system configuration tests
- auth/: Authentication flows, user roles (doctor, nurse, admin), session management
- patient/: Patient admission, discharge, medical records, consultation flows
- facility/: Facility management, bed allocation, staff assignment workflows
- resources/: Asset management, inventory tracking, equipment allocation

## Page Object Model (tests/pageObject/)

- Structure: auth/, dashboard/, facility/, Patients/, resources/, Users/ directories
- Naming: Use PascalCase for classes (e.g., `PatientPage`, `FacilityDashboard`)
- Methods: Action methods (clickSubmit, enterPatientData) and assertion methods (verifyPatientAdmitted)
- Selectors: Store all selectors as private properties, use data-testid attributes

## Healthcare-Specific Test Patterns

```typescript
// Example patient admission flow
await page.getByTestId("patient-admission-form").click();
await page.getByTestId("patient-name").fill("John Doe");
await page.getByTestId("patient-age").fill("45");
await page.getByTestId("medical-history").fill("Diabetes, Hypertension");
```

## API Intercept Patterns for CARE Backend

- Authentication: `await page.route('**/api/v1/auth/login/', route => route.fulfill({...}))`
- Patient APIs: `await page.route('**/api/v1/patient/**', route => route.fulfill({...}))`
- Facility APIs: `await page.route('**/api/v1/facility/**', route => route.fulfill({...}))`
- Consultation APIs: `await page.route('**/api/v1/consultation/', route => route.fulfill({...}))`
- File uploads: `await page.route('**/api/v1/files/', route => route.fulfill({...}))`

## Test Data Management (tests/fixtures/)

- users.json: Test user accounts with different roles (doctor, nurse, admin)
- facilities.json: Hospital/clinic test data with bed configurations
- patients.json: Mock patient records with PHI-safe data
- sample files: avatar.jpg, sample_file.xlsx, sample_img1.png for upload testing

## Custom Commands (tests/support/)

- Authentication: `await loginAs(userType)` - Login as doctor/nurse/admin
- Patient operations: `await createPatient(patientData)`, `await admitPatient()`
- Facility setup: `await selectFacility(facilityName)`, `await checkBedAvailability()`
- File operations: `await uploadMedicalFile(fileName)`

## Environment Configuration

- Local testing: `REACT_CARE_API_URL=http://127.0.0.1:9000`
- Staging: Use staging backend URL from environment variables
- Timeouts: Set `timeout: 10000` for API-heavy healthcare workflows
- Viewport: Use `tests/utils/viewPort.ts` for mobile/tablet/desktop medical device testing

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

## CI/CD Integration (.github/workflows/playwright.yaml)

- Parallel execution: Tests split across multiple runners for faster feedback
- Docker backend: Full CARE backend stack for integration testing
- Test artifacts: Screenshots and videos for failed healthcare workflows
- Staging deployment: Automatic testing on staging environment
