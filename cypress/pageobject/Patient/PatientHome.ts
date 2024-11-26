class PatientHome {
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
    cy.wait("@getPatients").its("response.statusCode").should("eq", 200);
  }

  typePatientCreatedBeforeDate(startDate: string) {
    cy.clickAndTypeDate("input[name='created_date_start']", startDate);
  }

  typePatientCreatedAfterDate(endDate: string) {
    cy.clickAndTypeDate("input[name='created_date_end']", endDate);
  }

  typePatientModifiedBeforeDate(startDate: string) {
    cy.clickAndTypeDate("input[name='modified_date_start']", startDate);
  }

  typePatientModifiedAfterDate(endDate: string) {
    cy.clickAndTypeDate("input[name='modified_date_end']", endDate);
  }

  typePatientAdmitedBeforeDate(startDate: string) {
    cy.clickAndTypeDate(
      "input[name='last_consultation_encounter_date_start']",
      startDate,
    );
  }

  typePatientAdmitedAfterDate(endDate: string) {
    cy.clickAndTypeDate(
      "input[name='last_consultation_encounter_date_end']",
      endDate,
    );
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

  verifyAnyDiagnosisBadgeContent(expectedText: string) {
    cy.get("[data-testid='Diagnoses (of any verification status)']").should(
      "contain",
      expectedText,
    );
  }

  verifyConfirmedDiagnosisBadgeContent(expectedText: string) {
    cy.get("[data-testid='Confirmed Diagnoses']").should(
      "contain",
      expectedText,
    );
  }

  verifyUnconfirmedDiagnosisBadgeContent(expectedText: string) {
    cy.get("[data-testid='Unconfirmed Diagnoses']").should(
      "contain",
      expectedText,
    );
  }

  verifyProvisionalDiagnosisBadgeContent(expectedText: string) {
    cy.get("[data-testid='Provisional Diagnoses']").should(
      "contain",
      expectedText,
    );
  }

  verifyDifferentialDiagnosisBadgeContent(expectedText: string) {
    cy.get("[data-testid='Differential Diagnoses']").should(
      "contain",
      expectedText,
    );
  }

  verifyFacilityNameBadgeContent(expectedText: string) {
    cy.get("[data-testid='Facility']").should("contain", expectedText);
  }

  verifyFacilityTypeBadgeContent(expectedText: string) {
    cy.get("[data-testid='Facility Type']").should("contain", expectedText);
  }

  verifyFacilityLsgBadgeContent(expectedText: string) {
    cy.get("[data-testid='LSG Body']").should("contain", expectedText);
  }

  verifyFacilityDistrictContent(expectedText: string) {
    cy.get("[data-testid='District']").should("contain", expectedText);
  }

  verifyPatientCreatedAfterDate(expectedText: string) {
    cy.get("[data-testid='Created after']").should("contain", expectedText);
  }
  verifyPatientCreatedBeforeDate(expectedText: string) {
    cy.get("[data-testid='Created before']").should("contain", expectedText);
  }
  verifyPatientModifiedAfterDate(expectedText: string) {
    cy.get("[data-testid='Modified after']").should("contain", expectedText);
  }
  verifyPatientModifiedBeforeDate(expectedText: string) {
    cy.get("[data-testid='Modified before']").should("contain", expectedText);
  }
  verifyPatientAdmittedBeforeDate(expectedText: string) {
    cy.get("[data-testid='Admitted before']").should("contain", expectedText);
  }
  verifyPatientAdmittedAfterDate(expectedText: string) {
    cy.get("[data-testid='Admitted after']").should("contain", expectedText);
  }
}
export default PatientHome;
