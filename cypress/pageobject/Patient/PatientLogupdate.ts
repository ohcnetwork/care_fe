class PatientLogupdate {
  clickLogupdate() {
    cy.get("#log-update").scrollIntoView();
    cy.verifyAndClickElement("#log-update", "Log Update");
    cy.wait(2000);
  }

  selectBed(bed: string) {
    cy.searchAndSelectOption("input[name='bed']", bed);
    cy.submitButton("Move to bed");
    cy.wait(2000);
  }

  clickAndVerifySlide(sliderId: string, value: string) {
    cy.get(`${sliderId} input[type="range"]`)
      .invoke("val", value)
      .trigger("input");
    cy.get(`${sliderId} input[type="range"]`).should("have.value", value);
  }

  selectPatientCategory(category: string) {
    cy.clickAndSelectOption("#patient_category", category);
  }

  typePhysicalExamination(examination: string) {
    cy.get("#physical_examination_info").click().type(examination);
    cy.get("#physical_examination_info").should("contain", examination);
  }

  typeOtherDetails(details: string) {
    cy.get("#other_details").click().type(details);
  }

  typeAdditionalSymptoms(symptoms: string) {
    cy.clickAndSelectOption("#additional_symptoms", symptoms);
  }

  typeSystolic(systolic: string) {
    cy.searchAndSelectOption("#systolic", systolic);
  }

  typeDiastolic(diastolic: string) {
    cy.searchAndSelectOption("#diastolic", diastolic);
  }

  typePulse(pulse: string) {
    cy.searchAndSelectOption("#pulse", pulse);
  }

  typeTemperature(temperature: string) {
    cy.searchAndSelectOption("#temperature", temperature);
  }

  typeRespiratory(respiratory: string) {
    cy.searchAndSelectOption("#resp", respiratory);
  }

  typeSpo2(spo: string) {
    cy.searchAndSelectOption("#ventilator_spo2", spo);
  }

  selectRhythm(rhythm: string) {
    cy.clickAndSelectOption("#rhythm", rhythm);
  }

  typeRhythm(rhythm: string) {
    cy.get("#rhythm_detail").click().type(rhythm);
  }

  clickLogupdateCard(element, patientCategory) {
    cy.get(element).scrollIntoView();
    cy.verifyContentPresence(element, [patientCategory]);
    cy.get(element).first().contains("View Details").click();
    cy.wait(3000);
  }

  clickUpdateDetail() {
    cy.verifyAndClickElement("#consultation-preview", "Update Details");
    cy.wait(3000);
  }

  clickClearButtonInElement(elementId) {
    cy.get(elementId).find("#clear-button").click();
  }

  clickVitals() {
    cy.get("#consultation_tab_nav").scrollIntoView();
    cy.verifyAndClickElement("#consultation_tab_nav", "Vitals");
  }

  clickCopyPreviousValue() {
    cy.get("#clone_last").click();
  }
}
export default PatientLogupdate;
