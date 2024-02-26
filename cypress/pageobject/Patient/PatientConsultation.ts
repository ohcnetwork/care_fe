export class PatientConsultationPage {
  selectConsultationStatus(status: string) {
    cy.wait(5000);
    cy.get("#route_to_facility").scrollIntoView();
    cy.get("#route_to_facility").should("be.visible");
    cy.clickAndSelectOption("#route_to_facility", status);
  }

  selectSymptoms(symptoms) {
    cy.clickAndMultiSelectOption("#symptoms", symptoms);
  }

  selectSymptomsDate(selector: string, date: string) {
    cy.clickAndTypeDate(selector, date);
  }

  verifyConsultationPatientName(patientName: string) {
    cy.get("#patient-name-consultation").should("contain", patientName);
  }

  selectPatientCategory(category: string) {
    cy.clickAndSelectOption("#category", category);
  }

  selectPatientReferance(referance: string) {
    cy.searchAndSelectOption("#referred_to", referance);
  }

  selectPatientWard(ward: string) {
    cy.searchAndSelectOption("#transferred_from_location", ward);
  }

  selectPatientSuggestion(suggestion: string) {
    cy.clickAndSelectOption("#suggestion", suggestion);
  }

  typeCauseOfDeath(cause: string) {
    cy.get("#cause_of_death").click().type(cause);
  }

  typeDeathConfirmedBy(doctor: string) {
    cy.get("#death_confirmed_doctor").click().type(doctor);
  }

  selectPatientDiagnosis(icdCode, statusId) {
    cy.searchAndSelectOption("#icd11-search", icdCode);
    cy.get("#diagnosis-list")
      .contains("Add as")
      .focus()
      .click()
      .then(() => {
        cy.get(`#${statusId}`).click();
      });
  }

  typePatientConsultationDate(selector: string, date: string) {
    cy.get(selector).clear().click().type(date);
  }

  clickPatientDetails() {
    cy.verifyAndClickElement("#consultationpage-header", "Patient Details");
  }

  typePatientIllnessHistory(history: string) {
    cy.get("#history_of_present_illness").clear().click().type(history);
  }

  typePatientExaminationHistory(examination: string) {
    cy.get("#examination_details").type(examination);
  }

  typePatientWeight(weight: string) {
    cy.get("#weight").type(weight);
  }

  typePatientHeight(height: string) {
    cy.get("#height").type(height);
  }

  typePatientNumber(number: string) {
    cy.get("#patient_no").scrollIntoView();
    cy.get("#patient_no").type(number);
  }

  selectPatientPrincipalDiagnosis(diagnosis: string) {
    cy.clickAndSelectOption("#principal-diagnosis-select", diagnosis);
  }

  verifyTextInConsultation(selector, text) {
    cy.get(selector).scrollIntoView();
    cy.get(selector).contains(text).should("be.visible");
  }

  typeReferringFacility(referringFacility: string) {
    cy.searchAndSelectOption("#referred_from_facility", referringFacility);
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

  clickEditConsultationButton() {
    cy.get("#consultation-buttons").scrollIntoView();
    cy.get("button").contains("Manage Patient").click();
    cy.verifyAndClickElement(
      "#consultation-buttons",
      "Edit Consultation Details"
    );
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
}
