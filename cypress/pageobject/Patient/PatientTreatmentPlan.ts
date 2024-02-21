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
}
export default PatientTreatmentPlan;
