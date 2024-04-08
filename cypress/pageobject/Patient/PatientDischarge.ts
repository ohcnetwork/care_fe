class PatientDischarge {
  clickDischarge() {
    cy.clickAndSelectOption("#show-more", "Discharge from CARE");
  }

  selectDischargeReason(reason: string) {
    cy.clickAndSelectOption("#discharge_reason", reason);
  }

  typeDischargeNote(note: string) {
    cy.get("#discharge_notes").type(note);
  }
}
export default PatientDischarge;
