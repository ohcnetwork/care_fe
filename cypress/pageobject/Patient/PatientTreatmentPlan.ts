class PatientTreatmentPlan {
  typePatientGeneralInstruction(instruction: string) {
    cy.get("#consultation_notes").type(instruction);
  }

  fillTreatingPhysician(doctor: string) {
    cy.typeAndSelectOption("#treating_physician", doctor);
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
    cy.typeAndSelectOption("#assigned_to", doctor);
  }

  clickAddProcedure() {
    cy.get("#procedure").scrollIntoView();
    cy.verifyAndClickElement("#procedure", "Add Procedures");
  }

  typeProcedureName(procedure: string) {
    cy.get("#procedure-name").type(procedure);
  }

  typeProcedureTime(time: string) {
    cy.clickAndTypeDate("#procedure-time", time);
  }

  typeTreatmentPlan(treatment: string) {
    cy.get("#treatment_plan").type(treatment);
  }

  typeSpecialInstruction(instruction: string) {
    cy.get("#special_instruction").type(instruction);
  }
}
export default PatientTreatmentPlan;
