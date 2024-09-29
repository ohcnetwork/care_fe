class PatientLogupdate {
  clickLogupdate() {
    cy.get("#log-update").scrollIntoView();
    cy.verifyAndClickElement("#log-update", "Log Update");
    cy.wait(2000);
  }

  clickSwitchBed() {
    cy.get("#switch-bed").click();
  }

  selectRoundType(roundType: string) {
    cy.clickAndSelectOption("#rounds_type", roundType);
  }

  selectBed(bed: string) {
    cy.searchAndSelectOption("input[name='bed']", bed);
    cy.get("#update-switchbed").click();
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

  clickLogUpdateViewDetails(element, patientCategory) {
    cy.get(element).scrollIntoView();
    cy.verifyContentPresence(element, [patientCategory]);
    cy.get(element).first().contains("View Details").click();
    cy.wait(3000);
  }

  clickLogUpdateUpdateLog(element, patientCategory) {
    cy.get(element).scrollIntoView();
    cy.verifyContentPresence(element, [patientCategory]);
    cy.get(element).first().contains("Update Log").click();
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

  selectNoBilateralAirFlow() {
    cy.get("#bilateral_air_entry-option-false").click();
  }

  typeEtco2(etco2: string) {
    cy.get("#etco2-range-input").type(etco2);
  }

  selectOxygenSupport() {
    cy.get("#respiratory_support-option-OXYGEN_SUPPORT").click();
  }

  selectNonBreathingModality() {
    cy.get("#ventilator_oxygen_modality-option-NON_REBREATHING_MASK").click();
  }

  typeOxygenFlowRate(flowRate: string) {
    cy.get("#oxygen_flow_rate-range-input").type(flowRate);
  }

  typeVentilatorSpo2(spo2: string) {
    cy.get("#ventilator_spo2-range-input").type(spo2);
  }

  selectCriticalCareSection(sectionName: string) {
    cy.contains("button", sectionName).click();
  }

  typeBloodSugar(bloodSugar: string) {
    cy.get("#blood_sugar_level-range-input").type(bloodSugar);
  }

  typeInsulinDosage(insulinDosage: string) {
    cy.get("#insulin_intake_dose-range-input").type(insulinDosage);
  }

  clickGoBackConsultation() {
    cy.get("#back-to-consultation").click();
  }

  typeFluidBalance(fluid: string) {
    cy.get("#dialysis_fluid_balance-range-input").type(fluid);
  }

  typeNetBalance(netBalance: string) {
    cy.get("#dialysis_net_balance-range-input").type(netBalance);
  }
}
export default PatientLogupdate;
