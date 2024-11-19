export class SampleTestPage {
  visitSampleRequestPage(): void {
    cy.verifyAndClickElement("#sample-request-btn", "Request Sample Test");
    cy.url().should("include", "/sample-test");
  }

  selectSampleType(option: string): void {
    cy.clickAndSelectOption("#sample-type", option);
  }

  selectIcmrCategory(option: string): void {
    cy.clickAndSelectOption("#icmr-category", option);
  }

  fillIcmrLabel(label: string): void {
    cy.get("#icmr-label").should("be.visible").type(label);
  }

  fillFastTrackReason(value: string): void {
    cy.get("#is_fast_track").should("be.visible").check();
    cy.get("#fast_track").should("be.visible").type(value);
  }

  fillDoctorName(value: string): void {
    cy.get("#doctor_name").should("be.visible").type(value);
  }

  fillAtypicalPresentation(value: string): void {
    cy.get("#is_atypical_presentation").should("be.visible").check();
    cy.get("#atypical_presentation").should("be.visible").type(value);
  }

  fillDiagnosis(value: string): void {
    cy.get("#diagnosis").should("be.visible").type(value);
  }

  fillEtiology(value: string): void {
    cy.get("#etiology_identified").should("be.visible").type(value);
  }

  fillDiffDiagnosis(value: string): void {
    cy.get("#diff_diagnosis").should("be.visible").type(value);
  }

  checkHasSari(): void {
    cy.get("#has_sari").should("be.visible").check();
  }

  checkHasAri(): void {
    cy.get("#has_ari").should("be.visible").check();
  }

  checkIsUnusualCourse(): void {
    cy.get("#is_unusual_course").should("be.visible").check();
  }

  checkRequestHistory(
    sampleTestStatus: string,
    sampleTestType: string,
    fastTrack: string,
    sampleTestResult: string,
  ): void {
    cy.verifyContentPresence("#sample-test-status", [sampleTestStatus]);
    cy.verifyContentPresence("#sample-test-type", [sampleTestType]);
    cy.verifyContentPresence("#sample-test-fast-track", [fastTrack]);
    cy.verifyContentPresence("#sample-test-result", [sampleTestResult]);
  }

  searchPatientSample(patientName: string): void {
    cy.get("#search_patient_name").should("be.visible").type(patientName);
  }

  verifyPatientName(patientName: string): void {
    cy.verifyContentPresence("#sample-test-patient-name", [patientName]);
  }

  clickOnSampleDetailsBtn(): void {
    cy.get("#sample-details-btn").should("be.visible").first().click();
  }

  verifyPatientTestDetails(
    patientName: string,
    fastTrackReason: string,
    doctorName: string,
    diagnosis: string,
    differentialDiagnosis: string,
    etiologyIdentified: string,
  ): void {
    cy.verifyContentPresence("#patient_name", [patientName]);
    cy.verifyContentPresence("#fast_track_reason", [fastTrackReason]);
    cy.verifyContentPresence("#doctor_name", [doctorName]);
    cy.verifyContentPresence("#diagnosis", [diagnosis]);
    cy.verifyContentPresence("#diff_diagnosis", [differentialDiagnosis]);
    cy.verifyContentPresence("#etiology_identified", [etiologyIdentified]);
  }

  interceptSampleTestReq(): void {
    cy.intercept("POST", "**/api/v1/patient/*/test_sample/").as(
      "sampleDetails",
    );
  }

  verifySampleTestReq(): void {
    cy.wait("@sampleDetails").its("response.statusCode").should("eq", 201);
  }

  interceptGetSampleTestReq(): void {
    cy.intercept("GET", "**/api/v1/test_sample/**").as("getSampleTestReq");
  }

  verifyGetSampleTestReq(): void {
    cy.wait("@getSampleTestReq").its("response.statusCode").should("eq", 200);
  }
}
