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

  typeMedicalHistory(index: number, text: string) {
    cy.get(`#medical_history_check_${index}`).click();
    cy.get(`#medical_history_${index}`).click().type(text);
  }

  clickNoneMedicialHistory() {
    cy.get("[name=medical_history_check_1]").scrollIntoView();
    cy.get("[name=medical_history_check_1]").check();
  }

  verifyPatientMedicalDetails(
    patientPresentHealth: string,
    patientOngoingMedication: string,
    patientAllergies: string,
    patientSymptoms1: string,
    patientSymptoms2: string,
    patientSymptoms3: string,
    patientSymptoms4: string,
    patientSymptoms5: string,
    patientSymptoms6: string,
    patientSymptoms7: string,
  ) {
    cy.get("a").contains("Health Profile").click();
    cy.wait(2000);
    cy.get("[data-test-id=patient-health-profile]").then(($dashboard) => {
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
