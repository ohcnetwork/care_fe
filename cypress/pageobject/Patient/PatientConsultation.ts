export class PatientConsultationPage {
  selectConsultationStatus(status: string) {
    cy.wait(5000);
    cy.get("#route_to_facility").scrollIntoView();
    cy.get("#route_to_facility").should("be.visible");
    cy.get("#route_to_facility")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(status).click();
      });
  }

  selectSymptoms(symptoms) {
    cy.clickAndMultiSelectOption("#symptoms", symptoms);
  }

  selectSymptomsDate(date: string) {
    cy.clickAndTypeDate("#symptoms_onset_date", date);
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

  typePatientDateTime(selector: string) {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, "0"); // Months are zero-based
    const day = currentDate.getDate().toString().padStart(2, "0");
    const hours = currentDate.getHours().toString().padStart(2, "0");
    const minutes = currentDate.getMinutes().toString().padStart(2, "0");

    // Format the date and time
    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

    // Type the formatted date and time into the field
    cy.get(selector).click().type(formattedDateTime);
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
