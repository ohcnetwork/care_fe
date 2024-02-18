export class PatientConsultationPage {
  selectConsultationStatus(status: string) {
    cy.get("#route_to_facility").scrollIntoView();
    cy.get("#route_to_facility").should("be.visible");
    cy.get("#route_to_facility")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(status).click();
      });
  }

  selectSymptoms(symptoms) {
    if (!Array.isArray(symptoms)) {
      symptoms = [symptoms];
    }
    cy.get("#symptoms")
      .click()
      .then(() => {
        symptoms.forEach((symptom) => {
          cy.get("[role='option']").contains(symptom).click();
        });
        cy.get("#symptoms").click();
      });
  }

  selectSymptomsDate(date: string) {
    cy.get("#symptoms_onset_date").click();
    cy.get("#date-input").click().type(date);
  }

  verifyConsultationPatientName(patientName: string) {
    cy.get("#patient-name-consultation").should("contain", patientName);
  }

  fillConsultationFieldById(elementId, text) {
    const selector = `#${elementId}`;
    cy.get(selector).scrollIntoView();
    cy.get(selector).should("be.visible");
    cy.get(selector).click().type(text);
  }

  selectPatientCategory(category: string) {
    cy.get("#category")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(category).click();
      });
  }

  selectPatientReferance(referance: string) {
    cy.get("#referred_to")
      .click()
      .type(referance)
      .then(() => {
        cy.get("[role='option']").contains(referance).click();
      });
  }

  selectPatientSuggestion(suggestion: string) {
    cy.get("#suggestion")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(suggestion).click();
      });
  }

  selectPatientDiagnosis(icdCode, statusId) {
    cy.get("#icd11-search")
      .click()
      .type(icdCode)
      .then(() => {
        cy.get("[role='option']").contains(icdCode).click();
      });
    cy.get("#diagnosis-list")
      .contains("Add as")
      .focus()
      .click()
      .then(() => {
        cy.get(`#${statusId}`).click();
      });
    cy.get("#diagnosis-list").scrollIntoView();
    cy.get("#diagnosis-list").contains(icdCode).should("be.visible");
  }

  selectPatientPrincipalDiagnosis(diagnosis: string) {
    cy.get("#principal-diagnosis-select")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(diagnosis).click();
      });
  }

  fillTreatingPhysican(doctor: string) {
    cy.get("#treating_physician")
      .click()
      .type(doctor)
      .then(() => {
        cy.get("[role='option']").contains(doctor).click();
      });
  }

  submitConsultation() {
    cy.get("#submit").contains("Create Consultation").click();
  }

  clickAddPrescription() {
    cy.contains("button", "Add Prescription Medication")
      .should("be.visible")
      .click();
  }

  interceptMediaBase() {
    cy.intercept("GET", "**/api/v1/medibase/**").as("getMediaBase");
  }

  prescribefirstMedicine() {
    cy.get("div#medicine_object input[placeholder='Select'][role='combobox']")
      .click()
      .type("dolo")
      .type("{downarrow}{enter}");
  }

  prescribesecondMedicine() {
    cy.get("div#medicine_object input[placeholder='Select'][role='combobox']")
      .click()
      .type("dolo")
      .type("{downarrow}{downarrow}{enter}");
  }

  selectMedicinebox() {
    cy.get(
      "div#medicine_object input[placeholder='Select'][role='combobox']"
    ).click();
  }

  visitFilesPage() {
    cy.get("#consultation_tab_nav").scrollIntoView();
    cy.get("#consultation_tab_nav").contains("Files").click();
  }

  uploadFile() {
    cy.get("#file_upload_patient").selectFile(
      "cypress/fixtures/sampleAsset.xlsx",
      { force: true }
    );
  }

  clickUploadFile() {
    cy.intercept("POST", "**/api/v1/files/").as("uploadFile");
    cy.get("#upload_file_button").click();
    cy.wait("@uploadFile").its("response.statusCode").should("eq", 201);
  }

  waitForMediabaseStatusCode() {
    cy.wait("@getMediaBase").its("response.statusCode").should("eq", 200);
  }

  enterDosage(doseAmount: string) {
    cy.get("#dosage").type(doseAmount, { force: true });
  }

  selectDosageFrequency(frequency: string) {
    cy.get("#frequency")
      .click()
      .then(() => {
        cy.get("div#frequency [role='option']").contains(frequency).click();
      });
  }

  submitPrescriptionAndReturn() {
    cy.intercept("POST", "**/api/v1/consultation/*/prescriptions/").as(
      "submitPrescription"
    );
    cy.get("button#submit").should("be.visible").click();
    cy.get("[data-testid='return-to-patient-dashboard']").click();
    cy.wait("@submitPrescription").its("response.statusCode").should("eq", 201);
  }

  clickEditConsultationButton() {
    cy.get("#consultation-buttons").scrollIntoView();
    cy.get("button").contains("Manage Patient").click();
    cy.get("#consultation-buttons")
      .contains("Edit Consultation Details")
      .click();
  }

  updateConsultation() {
    cy.intercept("PUT", "**/api/v1/consultation/**").as("updateConsultation");
    cy.get("#submit").contains("Update Consultation").click();
    cy.wait("@updateConsultation").its("response.statusCode").should("eq", 200);
  }

  visitShiftRequestPage() {
    cy.get("#create_shift_request").click();
  }

  createShiftRequest() {
    cy.intercept("POST", "**/api/v1/shift/").as("createShiftRequest");
    cy.get("#submit").click();
    cy.wait("@createShiftRequest").its("response.statusCode").should("eq", 201);
  }

  visitDoctorNotesPage() {
    cy.get("#patient_doctor_notes").scrollIntoView();
    cy.get("#patient_doctor_notes").click();
  }

  addDoctorsNotes(notes: string) {
    cy.get("#doctor_notes_textarea").scrollIntoView();
    cy.get("#doctor_notes_textarea").click().type(notes);
  }

  postDoctorNotes() {
    cy.intercept("POST", "**/api/v1/patient/*/notes").as("postDoctorNotes");
    cy.get("#add_doctor_note_button").click();
    cy.wait("@postDoctorNotes").its("response.statusCode").should("eq", 201);
  }

  clickDischargePatient() {
    cy.get("#show-more").scrollIntoView();
    cy.get("#show-more").click();
    cy.contains("p", "Discharge from CARE").click();
  }

  selectDischargeReason(reason: string) {
    cy.get("#discharge_reason")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(reason).click();
      });
  }

  addDischargeNotes(notes: string) {
    cy.get("#discharge_notes").type(notes);
  }

  confirmDischarge() {
    cy.intercept("POST", "**/api/v1/consultation/*/discharge_patient/").as(
      "dischargePatient"
    );
    cy.get("#submit").contains("Confirm Discharge").click();
    cy.wait("@dischargePatient").its("response.statusCode").should("eq", 200);
  }

  discontinuePreviousPrescription() {
    cy.intercept(
      "POST",
      "**/api/v1/consultation/*/prescriptions/*/discontinue/"
    ).as("deletePrescription");
    cy.get("button").contains("Discontinue").click();
    cy.get("#submit").contains("Discontinue").click();
    cy.wait("@deletePrescription").its("response.statusCode").should("eq", 200);
  }

  visitEditPrescriptionPage() {
    cy.get("#consultation_tab_nav").scrollIntoView();
    cy.get("#consultation_tab_nav").contains("Medicines").click();
    cy.get("a[href='prescriptions']").first().click();
  }

  submitPrescription() {
    cy.intercept("POST", "**/api/v1/consultation/*/prescriptions/").as(
      "submitPrescription"
    );
    cy.get("#submit").contains("Submit").click();
    cy.wait("@submitPrescription").its("response.statusCode").should("eq", 201);
  }
}
