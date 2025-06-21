class PatientVerify {
  verifyPatientName(expectedName: string) {
    cy.get('[data-cy="verify-patient-name"]').should("contain", expectedName);
    return this;
  }

  verifyCreateEncounterButton() {
    cy.get('[data-cy="create-encounter-button"]').should(
      "contain",
      "Create Encounter",
    );
    return this;
  }

  clickCreateEncounter() {
    cy.verifyAndClickElement(
      '[data-cy="create-encounter-button"]',
      "Create Encounter",
    );
    return this;
  }

  // Map display text to data-cy values for better maintainability
  private encounterTypeMap = {
    Observation: "obsenc",
    Inpatient: "imp",
    Ambulatory: "amb",
    Emergency: "emer",
    Virtual: "vr",
    "Home Health": "hh",
  };

  selectEncounterType(displayText: string) {
    const dataCyValue = this.encounterTypeMap[displayText];
    cy.verifyAndClickElement(
      `[data-cy="encounter-type-${dataCyValue}"]`,
      displayText,
    );
    return this;
  }

  selectEncounterStatus(status: string) {
    cy.clickAndSelectOption('[data-cy="encounter-status"]', status);
    return this;
  }

  selectEncounterPriority(priority: string) {
    cy.clickAndSelectOption('[data-cy="encounter-priority"]', priority);
    return this;
  }

  selectOrganization() {
    cy.clickAndSelectOption('[data-cy="facility-organization"]');
    return this;
  }

  clickSubmitEncounter() {
    cy.clickSubmitButton("Create Encounter");
    return this;
  }

  assertEncounterCreationSuccess() {
    cy.verifyNotification("Encounter created successfully");
    return this;
  }

  assertEncounterMaxFailure() {
    cy.verifyNotification(
      "Patient already has maximum number of active encounters (5)",
    );
    return this;
  }
}

export const patientVerify = new PatientVerify();
