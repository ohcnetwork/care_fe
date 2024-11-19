export class PatientConsultationPage {
  selectConsultationStatus(status: string) {
    cy.wait(5000);
    cy.get("#route_to_facility").scrollIntoView();
    cy.get("#route_to_facility").should("be.visible");
    cy.clickAndSelectOption("#route_to_facility", status);
  }

  typeAndMultiSelectSymptoms(input: string, symptoms: string[]) {
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
    cy.typeAndSelectOption("#referred_to", referance);
  }

  selectBed(bedNo: string) {
    cy.typeAndSelectOption("#bed", bedNo);
  }

  selectPatientWard(ward: string) {
    cy.typeAndSelectOption("#transferred_from_location", ward);
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

  selectPatientDiagnosis(icdCode: string, statusId: string) {
    cy.typeAndSelectOption("#icd11-search", icdCode);
    cy.get("#diagnosis-list")
      .contains("Add as")
      .scrollIntoView()
      .click()
      .then(() => {
        cy.get(`#${statusId}`).click();
      });
  }

  typePatientConsultationDate(selector: string, date: string) {
    cy.clickAndTypeDate(selector, date);
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

  verifyTextInConsultation(selector: string, text: string) {
    cy.get(selector).scrollIntoView();
    cy.get(selector).contains(text).should("be.visible");
  }

  typeReferringFacility(referringFacility: string) {
    cy.typeAndSelectOption("#referred_from_facility", referringFacility);
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

  interceptPatientDetailsAPI(): void {
    cy.intercept("GET", "**/api/v1/patient/**").as("patientDetails");
  }

  verifyPatientDetailsResponse(): void {
    cy.wait("@patientDetails").its("response.statusCode").should("eq", 200);
  }

  clickViewConsultationButton() {
    cy.verifyAndClickElement(
      "#view_consultation_and_log_updates",
      "View Consultation / Log Updates",
    );
  }

  clickManagePatientButton() {
    cy.verifyAndClickElement("#show-more", "Manage Patient");
  }

  clickClaimsButton() {
    cy.get("#log-update").scrollIntoView();
    cy.intercept(/\/api\/hcx\/policy\/\?.*/).as("policyStatus");
    cy.get("#consultation-buttons").contains("Claims").click();
    cy.wait("@policyStatus").its("response.statusCode").should("eq", 200);
  }
}
