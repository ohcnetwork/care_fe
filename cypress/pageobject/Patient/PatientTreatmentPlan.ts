class PatientTreatmentPlan {
  typePatientGeneralInstruction(instruction: string) {
    cy.get("#consultation_notes").type(instruction);
  }

  fillTreatingPhysican(doctor: string) {
    cy.searchAndSelectOption("#treating_physician", doctor);
  }

  selectReviewAfter(time: string) {
    cy.clickAndSelectOption("#review_interval", time);
  }

  selectAction(action: string) {
    cy.clickAndSelectOption("#action", action);
  }

  clickTelemedicineCheckbox() {
    cy.get("#is_telemedicine").click();
  }

  assignTelemedicineDoctor(doctor: string) {
    cy.searchAndSelectOption("#assigned_to", doctor);
  }

  clickAddProcedure() {
    cy.get("#procedure").scrollIntoView();
    cy.verifyAndClickElement("#procedure", "Add Procedures");
  }

  typeProcedureName(procedure: string) {
    cy.get("#procedure-name").type(procedure);
  }

  typeProcedureTime(time: string) {
    cy.get("#procedure-time").click();
    cy.get("#date-input").clear().type(time);
    cy.get("body").click(0, 0);
  }

  typeTreatmentPlan(treatment: string) {
    cy.get("#treatment_plan").type(treatment);
  }

  typeSpecialInstruction(instruction: string) {
    cy.get("#special_instruction").type(instruction);
  }
}
export default PatientTreatmentPlan;
