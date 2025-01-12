class PatientDashboard {
  verifyEncounterPatientInfo(contents: string[]) {
    cy.verifyContentPresence("#patient-infobadges", contents);
    return this;
  }
}

export const patientDashboard = new PatientDashboard();
