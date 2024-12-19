class PatientLogupdate {
  clickLogupdate() {
    cy.get("#log-update").scrollIntoView();
    cy.verifyAndClickElement("#log-update", "Log Update");
  }

  interceptConsultationBed() {
    cy.intercept("GET", "**/api/v1/consultationbed/*").as("getBed");
  }

  verifyConsultationBed() {
    cy.wait("@getBed").its("response.statusCode").should("eq", 200);
  }

  clickSwitchBed() {
    cy.get("#switch-bed").click();
  }

  selectRoundType(roundType: string) {
    cy.clickAndSelectOption("#rounds_type", roundType);
  }

  verifyRoundType(roundType: string) {
    cy.get("#rounds_type", { timeout: 10000 })
      .should("be.visible")
      .should("contain.text", roundType);
  }

  selectBed(bed: string) {
    cy.typeAndSelectOption("input[name='bed']", bed);
    cy.intercept("POST", "**/api/v1/consultationbed/").as(
      "postConsultationBed",
    );
    cy.get("#update-switchbed").click();
    cy.wait("@postConsultationBed")
      .its("response.statusCode")
      .should("eq", 201);
  }

  selectPatientCategory(category: string) {
    cy.clickAndSelectOption("#patientCategory", category);
  }

  verifyPatientCategory(category: string) {
    cy.get("#patientCategory", { timeout: 10000 })
      .should("be.visible")
      .should("contain.text", category);
  }

  typePhysicalExamination(
    examination: string,
    clearBeforeTyping: boolean = false,
  ) {
    cy.typeIntoField("#physical_examination_info", examination, {
      clearBeforeTyping,
    });
  }

  typeOtherDetails(details: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField("#other_details", details, { clearBeforeTyping });
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

  typeSystolic(systolic: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField("#systolic", systolic, { clearBeforeTyping });
  }

  typeDiastolic(diastolic: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField("#diastolic", diastolic, { clearBeforeTyping });
  }

  typePulse(pulse: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField("#pulse", pulse, { clearBeforeTyping });
  }

  typeTemperature(temperature: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField("#temperature", temperature, { clearBeforeTyping });
  }

  typeRespiratory(respiratory: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField("#resp", respiratory, { clearBeforeTyping });
  }

  typeSpo2(spo: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField("#ventilator_spo2", spo, { clearBeforeTyping });
  }

  selectRhythm(rhythm: string) {
    cy.clickAndSelectOption("#rhythm", rhythm);
  }

  typeRhythm(rhythm: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField("#rhythm_detail", rhythm, { clearBeforeTyping });
  }

  interceptDailyRounds() {
    cy.intercept("GET", "**/api/v1/consultation/*/daily_rounds/*/").as(
      "getDailyRounds",
    );
  }

  verifyDailyRounds() {
    cy.wait("@getDailyRounds").its("response.statusCode").should("eq", 200);
  }

  interceptpatchDailyRounds() {
    cy.intercept("PATCH", "**/api/v1/consultation/*/daily_rounds/*/").as(
      "patchDailyRounds",
    );
  }

  verifypatchDailyRounds() {
    cy.wait("@patchDailyRounds").its("response.statusCode").should("eq", 200);
  }

  clickLogUpdateViewDetails(element: string, patientCategory: string) {
    cy.get(element).scrollIntoView();
    cy.verifyContentPresence(element, [patientCategory]);
    this.interceptDailyRounds();
    cy.get(element).first().contains("View Details").click();
    this.verifyDailyRounds();
  }

  clickLogUpdateUpdateLog(element: string, patientCategory: string) {
    cy.get(element).scrollIntoView();
    cy.verifyContentPresence(element, [patientCategory]);
    this.interceptDailyRounds();
    cy.get(element).first().contains("Update Log").click();
    this.verifyDailyRounds();
  }

  clickUpdateDetail() {
    this.interceptDailyRounds();
    cy.verifyAndClickElement("#consultation-preview", "Update Log");
    this.verifyDailyRounds();
  }

  clickVitals() {
    cy.get("#consultation_tab_nav").scrollIntoView();
    cy.verifyAndClickElement("#consultation_tab_nav", "Vitals");
  }

  selectNoBilateralAirFlow() {
    cy.get("#bilateral_air_entry-option-false").click();
  }

  typeEtco2(etco2: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField("#etco2-range-input", etco2, { clearBeforeTyping });
  }

  selectOxygenSupport() {
    cy.get("#respiratory_support-option-OXYGEN_SUPPORT").click();
  }

  selectNonBreathingModality() {
    cy.get("#ventilator_oxygen_modality-option-NON_REBREATHING_MASK").click();
  }

  typeOxygenFlowRate(flowRate: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField("#oxygen_flow_rate-range-input", flowRate, {
      clearBeforeTyping,
    });
  }

  typeVentilatorSpo2(spo2: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField("#ventilator_spo2-range-input", spo2, {
      clearBeforeTyping,
    });
  }

  selectCriticalCareSection(sectionName: string) {
    cy.contains("button", sectionName).click();
  }

  typeBloodSugar(bloodSugar: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField("#blood_sugar_level-range-input", bloodSugar, {
      clearBeforeTyping,
    });
  }

  typeInsulinDosage(insulinDosage: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField("#insulin_intake_dose-range-input", insulinDosage, {
      clearBeforeTyping,
    });
  }

  clickGoBackConsultation() {
    cy.get("#back-to-consultation").click();
  }

  typeFluidBalance(fluid: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField("#dialysis_fluid_balance-range-input", fluid, {
      clearBeforeTyping,
    });
  }

  typeNetBalance(netBalance: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField("#dialysis_net_balance-range-input", netBalance, {
      clearBeforeTyping,
    });
  }
}
export default PatientLogupdate;
