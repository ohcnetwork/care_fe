class PatientDischarge {
  clickDischarge() {
    cy.get("#show-more").scrollIntoView();
    cy.verifyAndClickElement("#show-more", "Manage Patient");
    cy.verifyAndClickElement("#show-more", "Discharge from CARE");
  }

  selectDischargeReason(reason: string) {
    cy.clickAndSelectOption("#discharge_reason", reason);
  }

  typeDischargeNote(note: string) {
    cy.get("#discharge_notes").type(note);
  }

  typeReferringFacility(facility: string) {
    cy.typeAndSelectOption("#facility-referredto", facility);
  }

  clickClearButton() {
    cy.get("#clear-button").click();
  }

  typeDoctorName(doctorName: string) {
    cy.get("#death_confirmed_by").type(doctorName);
  }
}

export default PatientDischarge;
