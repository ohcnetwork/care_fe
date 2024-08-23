class PatientLogupdate {
  clickLogupdate() {
    cy.get("#log-update").scrollIntoView();
    cy.verifyAndClickElement("#log-update", "Log Update");
    cy.wait(2000);
  }

  selectRoundType(roundType: string) {
    cy.clickAndSelectOption("#rounds_type", roundType);
  }

  selectBed(bed: string) {
    cy.searchAndSelectOption("input[name='bed']", bed);
    cy.submitButton("Update");
    cy.wait(2000);
  }

  selectPatientCategory(category: string) {
    cy.clickAndSelectOption("#patientCategory", category);
  }

  typePhysicalExamination(examination: string) {
    cy.get("#physical_examination_info").click().type(examination);
    cy.get("#physical_examination_info").should("contain", examination);
  }

  typeOtherDetails(details: string) {
    cy.get("#other_details").click().type(details);
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
}
export default PatientLogupdate;
