class PatientHome {
  clickNextPage() {
    cy.get("#next-pages").click();
  }

  verifySecondPageUrl() {
    cy.url().should("include", "/patients?page=2");
  }

  clickPreviousPage() {
    cy.get("#prev-pages").click();
  }

  clickPatientExport() {
    cy.get("#patient-export").click();
  }

  clickPatientFilterApply() {
    cy.get("#apply-filter").click();
  }

  interceptPatientExportRequest() {
    cy.intercept({
      method: "GET",
      url: "/api/v1/patient/*",
    }).as("getPatients");
  }

  verifyPatientExportRequest() {
    cy.wait("@getPatients").then((interception) => {
      expect(interception.request.url).to.include("/api/v1/patient/");
      expect(interception.request.url).to.include("&csv");
      expect(interception.response.statusCode).to.eq(200);
    });
  }

  typePatientModifiedBeforeDate(startDate: string) {
    cy.clickAndTypeDate("input[name='modified_date_start']", startDate);
  }

  typePatientModifiedAfterDate(endDate: string) {
    cy.clickAndTypeDate("input[name='modified_date_end']", endDate);
  }

  clickPatientAdvanceFilters() {
    cy.get("#advanced-filter").click();
  }

  selectPatientGenderfilter(gender: string) {
    cy.clickAndSelectOption("#gender-advancefilter", gender);
  }

  selectPatientCategoryfilter(category: string) {
    cy.clickAndSelectOption("#category-advancefilter", category);
  }

  typePatientMinimumAgeFilter(minage: string) {
    cy.get("#age_min").type(minage);
  }

  typePatientMaximumAgeFilter(maxage: string) {
    cy.get("#age_max").type(maxage);
  }

  selectPatientLastAdmittedBed(bed: string) {
    cy.clickAndMultiSelectOption(
      "#last_consultation_admitted_bed_type_list",
      bed,
    );
  }

  selectPatientLastConsentType(consent: string) {
    cy.clickAndMultiSelectOption("#last_consultation__consent_types", consent);
  }

  selectPatientTelemedicineFilter(telemedicine: string) {
    cy.clickAndSelectOption("#telemedicine-advancefilter", telemedicine);
  }

  selectPatientReviewFilter(review: string) {
    cy.clickAndSelectOption("#review-advancefilter", review);
  }

  selectPatientMedicoFilter(medico: string) {
    cy.clickAndSelectOption("#medico-advancefilter", medico);
  }

  verifyGenderBadgeContent(expectedText: string) {
    cy.get("[data-testid='Gender']").should("contain", expectedText);
  }

  verifyCategoryBadgeContent(expectedText: string) {
    cy.get("[data-testid='Category']").should("contain", expectedText);
  }

  verifyMinAgeBadgeContent(expectedText: string) {
    cy.get("[data-testid='Age min']").should("contain", expectedText);
  }

  verifyMaxAgeBadgeContent(expectedText: string) {
    cy.get("[data-testid='Age max']").should("contain", expectedText);
  }

  verifyLastAdmittedBedBadgeContent(expectedText: string) {
    cy.get("[data-testid='Bed Type']").should("contain", expectedText);
  }

  verifyLastConsentTypeBadgeContent(expectedText: string) {
    cy.get("[data-testid='Has Consent']").should("contain", expectedText);
  }

  verifyTelemedicineBadgeContent(expectedText: string) {
    cy.get("[data-testid='Telemedicine']").should("contain", expectedText);
  }

  verifyReviewMissedBadgeContent(expectedText: string) {
    cy.get("[data-testid='Review Missed']").should("contain", expectedText);
  }

  verifyMedicoBadgeContent(expectedText: string) {
    cy.get("[data-testid='Is Medico-Legal Case']").should(
      "contain",
      expectedText,
    );
  }

  verifyTotalPatientCount(count: string) {
    cy.get("#total-patientcount").should("contain", count);
  }

  selectAnyIcdDiagnosis(input: string, random: string) {
    cy.typeAndMultiSelectOption("#diagnoses", input, random);
  }

  selectConfirmedIcdDiagnosis(input: string, confirmed: string) {
    cy.typeAndMultiSelectOption("#diagnoses_confirmed", input, confirmed);
  }

  selectUnconfirmedIcdDiagnosis(input: string, unconfirmed: string) {
    cy.typeAndMultiSelectOption("#diagnoses_unconfirmed", input, unconfirmed);
  }

  selectProvisionalIcdDiagnosis(input: string, unconfirmed: string) {
    cy.typeAndMultiSelectOption("#diagnoses_provisional", input, unconfirmed);
  }

  selectDifferentialIcdDiagnosis(input: string, unconfirmed: string) {
    cy.typeAndMultiSelectOption("#diagnoses_differential", input, unconfirmed);
  }

  typeFacilityName(facilityName: string) {
    cy.typeAndSelectOption("input[name='facility']", facilityName);
  }

  selectFacilityType(facilityType: string) {
    cy.clickAndSelectOption("#facility-type", facilityType);
  }

  typeFacilityLsgBody(lsgbody: string) {
    cy.typeAndSelectOption("#facility-lsgbody", lsgbody);
  }

  typeFacilityDistrict(district: string) {
    cy.typeAndSelectOption("#facility-district", district);
  }
}
export default PatientHome;
