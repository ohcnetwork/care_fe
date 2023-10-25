export class PatientConsultationPage {
  selectConsultationStatus(status: string) {
    cy.get("#consultation_status").scrollIntoView();
    cy.get("#consultation_status").should("be.visible");
    cy.get("#consultation_status")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(status).click();
      });
  }

  selectSymptoms(symptoms: string) {
    cy.get("#symptoms")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(symptoms).click();
      });
  }

  fillIllnessHistory(history: string) {
    cy.wait(5000);
    cy.get("#history_of_present_illness").scrollIntoView();
    cy.get("#history_of_present_illness").should("be.visible");
    cy.get("#history_of_present_illness").click().type(history);
  }

  enterConsultationDetails(
    category: string,
    examinationDetails: string,
    weight: string,
    height: string,
    ipNumber: string,
    consulationNotes: string,
    verificationBy: string
  ) {
    cy.get("#symptoms").click();
    cy.get("#category")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(category).click();
      });
    cy.get("#examination_details").click().type(examinationDetails);
    cy.get("#weight").click().type(height);
    cy.get("#height").click().type(weight);
    cy.get("#patient_no").type(ipNumber);
    cy.intercept("GET", "**/icd/**").as("getIcdResults");
    cy.get(
      "#icd11_diagnoses_object input[placeholder='Select'][role='combobox']"
    )
      .scrollIntoView()
      .click()
      .type("1A");
    cy.get("#icd11_diagnoses_object [role='option']")
      .contains("1A00 Cholera")
      .scrollIntoView()
      .click();
    cy.get("label[for='icd11_diagnoses_object']").click();
    cy.wait("@getIcdResults").its("response.statusCode").should("eq", 200);

    cy.get("#icd11_principal_diagnosis [role='combobox']").click().type("1A");
    cy.get("#icd11_principal_diagnosis [role='option']")
      .contains("1A00 Cholera")
      .click();

    cy.get("#consultation_notes").click().type(consulationNotes);
    cy.get("#verified_by")
      .click()
      .type(verificationBy)
      .then(() => {
        cy.get("[role='option']").contains("Dev Doctor").click();
      });
  }

  submitConsultation() {
    cy.get("#submit").click();
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
    cy.get("a").contains("Files").click();
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

  visitEditConsultationPage() {
    cy.get("#view_consulation_updates").click();
    cy.get("button").contains("Edit Consultation Details").click();
  }

  setSymptomsDate(date: string) {
    cy.get("#symptoms_onset_date")
      .click()
      .then(() => {
        cy.get("[placeholder='DD/MM/YYYY']").type(date);
      });
  }

  updateConsultation() {
    cy.intercept("PUT", "**/api/v1/consultation/**").as("updateConsultation");
    cy.get("#submit").contains("Update Consultation").click();
    cy.wait("@updateConsultation").its("response.statusCode").should("eq", 200);
  }

  verifySuccessNotification(message: string) {
    cy.verifyNotification(message);
  }

  updateSymptoms(symptoms: string) {
    this.selectSymptoms(symptoms);
    cy.get("#symptoms").click();
  }

  visitShiftRequestPage() {
    cy.get("#create_shift_request").click();
  }

  enterPatientShiftDetails(
    name: string,
    phone_number: string,
    facilityName: string,
    reason: string
  ) {
    cy.get("#refering_facility_contact_name").type(name);
    cy.get("#refering_facility_contact_number").type(phone_number);
    cy.get("input[name='assigned_facility']")
      .type(facilityName)
      .then(() => {
        cy.get("[role='option']").first().click();
      });
    cy.get("#reason").type(reason);
  }

  createShiftRequest() {
    cy.intercept("POST", "**/api/v1/shift/").as("createShiftRequest");
    cy.get("#submit").click();
    cy.wait("@createShiftRequest").its("response.statusCode").should("eq", 201);
  }

  visitDoctorNotesPage() {
    cy.get("#patient_doctor_notes").click();
  }

  addDoctorsNotes(notes: string) {
    cy.get("#doctor_notes_textarea").type(notes);
  }

  postDoctorNotes() {
    cy.intercept("POST", "**/api/v1/patient/*/notes").as("postDoctorNotes");
    cy.get("#submit").contains("Post Your Note").click();
    cy.wait("@postDoctorNotes").its("response.statusCode").should("eq", 201);
  }

  clickDischargePatient() {
    cy.get("#discharge_patient_from_care").click();
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
