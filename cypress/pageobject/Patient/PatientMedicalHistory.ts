class PatientMedicalHistory {
  typePatientOngoingMedication(ongoingMedication: string) {
    cy.get("#ongoing_medication").click().type(ongoingMedication);
  }

  typePatientPresentHealth(presentHealth: string) {
    cy.get("#present_health").click().type(presentHealth);
  }

  typePatientAllergies(allergies: string) {
    cy.get("#allergies").click().type(allergies);
  }

  typeMedicalHistory(index, text) {
    cy.get(`#medical_history_check_${index}`).click();
    cy.get(`#medical_history_${index}`).click().type(text);
  }

  clickNoneMedicialHistory() {
    cy.get("[name=medical_history_check_1]").scrollIntoView();
    cy.get("[name=medical_history_check_1]").check();
  }

  verifyPatientMedicalDetails(
    patientPresentHealth,
    patientOngoingMedication,
    patientAllergies,
    patientSymptoms1,
    patientSymptoms2,
    patientSymptoms3,
    patientSymptoms4,
    patientSymptoms5,
    patientSymptoms6,
    patientSymptoms7,
  ) {
    cy.get("[data-testid=patient-details]").then(($dashboard) => {
      cy.url().should("include", "/facility/");
      expect($dashboard).to.contain(patientPresentHealth);
      expect($dashboard).to.contain(patientOngoingMedication);
      expect($dashboard).to.contain(patientAllergies);
      expect($dashboard).to.contain(patientSymptoms1);
      expect($dashboard).to.contain(patientSymptoms2);
      expect($dashboard).to.contain(patientSymptoms3);
      expect($dashboard).to.contain(patientSymptoms4);
      expect($dashboard).to.contain(patientSymptoms5);
      expect($dashboard).to.contain(patientSymptoms6);
      expect($dashboard).to.contain(patientSymptoms7);
    });
  }

  verifyNoSymptosPresent(patientSymptoms1: string) {
    cy.get("[data-testid=patient-details]").should(
      "not.contain",
      patientSymptoms1,
    );
  }
}

export default PatientMedicalHistory;
