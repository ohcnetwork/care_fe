import { cy } from "local-cypress";
export class PatientSampleRequest {
  visitPatientDetails() {
    cy.get("#patient-details").click();
  }
  visitSampleRequest() {
    cy.get("#sample-request").click({ force: true });
  }
  selectSampleTestType() {
    cy.get("#sample_type").click();
    cy.get("#sample_type ul").first().click();
  }
  selectICMRCategory() {
    cy.get("#icmr_category").click();
    cy.get("#icmr_category ul").first().click();
  }
  typeICMRLabel(name: string) {
    cy.get("input[name=icmr_label]").type(name);
  }
  selectIsFastTrackRequired(bool: boolean) {
    if (bool) cy.get("input[name=isFastTrack]").click();
    else return;
  }
  fastTrackReason(bool: boolean, reason: string) {
    if (bool) cy.get("#fast_track").type(reason);
    else return;
  }
  selectTestingFacility(facility: string) {
    cy.searchAndSelectOption("input[name=testing_facility]", facility);
  }
  typeDoctorName(name: string) {
    cy.get("#doctor_name").type(name);
  }
  selectIsATypicalPresentation(bool: boolean) {
    if (bool) cy.get("input[name=is_atypical_presentation]").click();
    else return;
  }

  atypicalDetails(bool: boolean, details: string) {
    if (bool) cy.get("#atypical_presentation").type(details);
    else return;
  }
  typeDiagnosis(diagnosis: string) {
    cy.get("#diagnosis").type(diagnosis);
  }
  typeEtiologyIdentified(etiology: string) {
    cy.get("#etiology_identified").type(etiology);
  }
  typeDifferentialDiagnosis(diagnosis: string) {
    cy.get("#diff_diagnosis").type(diagnosis);
  }
  selectHasSari(bool: boolean) {
    if (bool) cy.get("input[name=has_sari]").click();
    else return;
  }
  selectHasAri(bool: boolean) {
    if (bool) cy.get("input[name=has_ari]").click();
    else return;
  }
  selectIsUnusual(bool: boolean) {
    if (bool) cy.get("input[name=is_unusual_course]").click();
    else return;
  }
  clickSubmitButton() {
    cy.intercept("POST", "**/api/v1/patient/*/test_sample").as(
      "createSampleRequest"
    );
    cy.get("#submit").click();
    cy.wait("@createSampleRequest")
      .its("response.statusCode")
      .should("eq", 201);
  }
  clickCancelButton() {
    cy.get("#cancel").click();
  }
}
