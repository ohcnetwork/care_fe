export class SampleTestPage {
  visitSampleRequestPage() {
    cy.verifyAndClickElement("#sample-request-btn", "Request Sample Test");
  }

  selectSampleType(option: string) {
    cy.clickAndSelectOption("#sample-type", option);
  }

  selectIcmrCategory(option: string) {
    cy.clickAndSelectOption("#icmr-category", option);
  }

  fillIcmrLabel(label: string) {
    cy.get("#icmr-label").should("be.visible").type(label);
  }

  fillFastTrackReason(value: string) {
    cy.get("#is_fast_track").should("be.visible").check();
    cy.get("#fast_track").should("be.visible").type(value);
  }

  fillDoctorName(value: string) {
    cy.get("#doctor_name").should("be.visible").type(value);
  }

  fillAtypicalPresentation(value: string) {
    cy.get("#is_atypical_presentation").should("be.visible").check();
    cy.get("#atypical_presentation").should("be.visible").type(value);
  }

  fillDiagnosis(value: string) {
    cy.get("#diagnosis").should("be.visible").type(value);
  }

  fillEtiology(value: string) {
    cy.get("#etiology_identified").should("be.visible").type(value);
  }

  fillDiffDiagnosis(value: string) {
    cy.get("#diff_diagnosis").should("be.visible").type(value);
  }

  checkHasSari() {
    cy.get("#has_sari").should("be.visible").check();
  }

  checkHasAri() {
    cy.get("#has_ari").should("be.visible").check();
  }

  checkIsUnusualCourse() {
    cy.get("#is_unusual_course").should("be.visible").check();
  }

  checkRequestHistory(fastTrack: string) {
    cy.verifyContentPresence("#sample-test-status", ["Request Submitted"]);
    cy.verifyContentPresence("#sample-test-type", ["ba/eta"]);
    cy.verifyContentPresence("#sample-test-fast-track", [fastTrack]);
    cy.verifyContentPresence("#sample-test-result", ["Awaiting"]);
  }

  searchPatientSample(patientName: string) {
    cy.get("#search_patient_name").should("be.visible").type(patientName);
  }

  verifyPatientName(patientName: string) {
    cy.verifyContentPresence("#sample-test-patient-name", [patientName]);
  }

  clickOnSampleDetailsBtn() {
    cy.get("#sample-details-btn").should("be.visible").first().click();
  }

  verifyPatientTestDetails(
    patientName: string,
    fastTrackReason: string,
    diagnosis: string,
    differentialDiagnosis: string,
    etiologyIdentified: string,
  ) {
    cy.verifyContentPresence("#patient_name", [patientName]);
    cy.verifyContentPresence("#fast_track_reason", [fastTrackReason]);
    cy.verifyContentPresence("#doctor_name", ["Dr John Doe"]);
    cy.verifyContentPresence("#diagnosis", [diagnosis]);
    cy.verifyContentPresence("#diff_diagnosis", [differentialDiagnosis]);
    cy.verifyContentPresence("#etiology_identified", [etiologyIdentified]);
  }

  interceptPatientDetailsAPI() {
    cy.intercept("GET", "**/api/v1/patient/**").as("patientDetails");
  }

  verifyPatientDetailsResponse() {
    cy.wait("@patientDetails").its("response.statusCode").should("eq", 200);
  }

  interceptSampleTestReq() {
    cy.intercept("GET", "**/api/v1/patient/*/test_sample/**").as(
      "sampleDetails",
    );
  }

  verifySampleTestReq() {
    cy.wait("@sampleDetails").its("response.statusCode").should("eq", 200);
  }

  interceptGetSampleTestReq() {
    cy.intercept("GET", "**/api/v1/test_sample/**").as("getSampleTestReq");
  }

  verifyGetSampleTestReq() {
    cy.wait("@getSampleTestReq").its("response.statusCode").should("eq", 200);
  }
}
