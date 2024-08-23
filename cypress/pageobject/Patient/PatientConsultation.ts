export class PatientConsultationPage {
  selectConsultationStatus(status: string) {
    cy.wait(5000);
    cy.get("#route_to_facility").scrollIntoView();
    cy.get("#route_to_facility").should("be.visible");
    cy.clickAndSelectOption("#route_to_facility", status);
  }

  typeAndMultiSelectSymptoms(input, symptoms) {
    cy.typeAndMultiSelectOption("#additional_symptoms", input, symptoms);
  }
  selectSymptomsDate(date: string) {
    cy.clickAndTypeDate("#symptoms_onset_date", date);
  }
  clickAddSymptom() {
    cy.get("#add-symptom").click();
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

  selectBed(bedNo: string) {
    cy.searchAndSelectOption("#bed", bedNo);
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

  clickEditConsultationButton() {
    cy.get("#consultation-buttons").scrollIntoView();
    cy.get("button").contains("Manage Patient").click();
    cy.verifyAndClickElement(
      "#consultation-buttons",
      "Edit Consultation Details",
    );
    cy.wait(3000);
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
}
