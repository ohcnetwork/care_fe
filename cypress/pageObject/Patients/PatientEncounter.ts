interface AllergyDetails {
  allergyName?: string;
  criticality?: string;
  status?: string;
  notes?: string;
}

interface DiagnosisDetails {
  diagnosisName?: string;
  status?: string;
  verification?: string;
  notes?: string;
}

interface SymptomDetails {
  symptomName?: string;
  severity?: string;
  status?: string;
  notes?: string;
}
export class PatientEncounter {
  // Navigation
  navigateToEncounters() {
    cy.verifyAndClickElement('[data-cy="nav-patients"]', "Patients");
    cy.verifyAndClickElement('[data-cy="nav-encounters"]', "Encounters");
    return this;
  }

  openFirstEncounterDetails() {
    cy.get('[data-cy="encounter-list-cards"]')
      .first()
      .contains("View Details")
      .click();
    return this;
  }

  searchEncounter(patientName: string) {
    cy.get('[data-cy="search-encounter"]').click();
    cy.typeIntoField("#encounter-search", patientName);
    cy.get('[data-cy="search-encounter"]').click();
    return this;
  }

  clickEditAllergy() {
    cy.verifyAndClickElement('[data-cy="edit-allergies"]', "Edit");
    return this;
  }

  clickAddAllergy() {
    cy.verifyAndClickElement('[data-cy="add-allergies"]', "Add Allergy");
    return this;
  }

  addAllergy(details: AllergyDetails) {
    const { allergyName } = details;
    cy.get('[data-cy="add-allergy"]').scrollIntoView();
    cy.typeAndSelectOption('[data-cy="add-allergy"]', allergyName, false);
    return this;
  }

  updateAllergy(details: AllergyDetails) {
    const { criticality, status, notes } = details;
    if (criticality) {
      cy.clickAndSelectOption('[data-cy="allergy-criticality"]', criticality, {
        position: "first",
      });
    }
    if (status) {
      cy.clickAndSelectOption('[data-cy="allergy-status"]', status, {
        position: "first",
      });
    }
    if (notes) {
      cy.typeIntoField('[data-cy="allergy-notes"]', notes, {
        position: "first",
        skipVerification: true,
      });
    }
    return this;
  }

  deleteAllergy() {
    cy.clickAndSelectOption('[data-cy="allergy-status"]', "Entered in Error", {
      position: "first",
    });
    return this;
  }

  verifyAllergyDelete(name: string) {
    cy.get('[data-cy="allergies-table"]').then(($el) => {
      cy.wrap($el).should("not.contain", name);
    });
    return this;
  }

  verifyAllergy(details: AllergyDetails) {
    const { allergyName, criticality, status, notes } = details;
    cy.verifyContentPresence('[data-cy="allergies-table"]', [
      allergyName,
      criticality,
      status,
    ]);

    if (notes) {
      cy.get('[data-cy="allergy-see-note"]').first().scrollIntoView();
      cy.get('[data-cy="allergy-see-note"]').first().click();
      cy.get('[data-cy="allergy-note"]').first().should("contain", notes);
    }

    return this;
  }

  clickEditSymptoms() {
    cy.verifyAndClickElement('[data-cy="edit-symptoms"]', "Edit");
    return this;
  }

  clickAddSymptoms() {
    cy.verifyAndClickElement('[data-cy="add-symptoms"]', "Add Symptoms");
    return this;
  }

  addSymptoms(details: SymptomDetails) {
    const { symptomName } = details;
    cy.get('[data-cy="add-symptom"]').scrollIntoView();
    cy.typeAndSelectOption('[data-cy="add-symptom"]', symptomName, false);
    return this;
  }

  updateSymptom(details: SymptomDetails) {
    const { severity, status, notes } = details;
    if (severity) {
      cy.get('[data-cy="symptom-severity"]').last().scrollIntoView();
      cy.clickAndSelectOption('[data-cy="symptom-severity"]', severity, {
        position: "last",
      });
    }
    if (status) {
      cy.get('[data-cy="symptom-status"]').last().scrollIntoView();
      cy.clickAndSelectOption('[data-cy="symptom-status"]', status, {
        position: "last",
      });
    }
    if (notes) {
      cy.get('[data-cy="symptom-options"]').last().click();
      cy.get('[data-cy="add-symptom-notes"]').last().click();
      cy.typeIntoField('[data-cy="symptom-notes"]', notes, {
        position: "last",
        skipVerification: true,
      });
    }
    return this;
  }

  deleteSymptom() {
    cy.get('[data-cy="symptom-options"]').last().scrollIntoView();
    cy.get('[data-cy="symptom-options"]').last().click();
    cy.get('[data-cy="remove-symptom"]').click();
    return this;
  }

  verifySymptomDelete(name: string) {
    cy.get('[data-cy="symptoms-table"]').scrollIntoView();
    cy.get('[data-cy="symptoms-table"]').then(($el) => {
      cy.wrap($el).should("not.contain", name);
    });
    return this;
  }

  verifySymptom(details: SymptomDetails) {
    const { symptomName, severity, status, notes } = details;
    cy.verifyContentPresence('[data-cy="symptoms-table"]', [
      symptomName,
      severity,
      status,
    ]);

    if (notes) {
      cy.get('[data-cy="symptom-see-note"]').first().scrollIntoView();
      cy.get('[data-cy="symptom-see-note"]').first().click();
      cy.get('[data-cy="symptom-note"]').first().should("contain", notes);
    }

    return this;
  }

  clickEditDiagnosis() {
    cy.verifyAndClickElement('[data-cy="edit-diagnoses"]', "Edit");
    return this;
  }

  clickAddDiagnosis() {
    cy.verifyAndClickElement('[data-cy="add-diagnoses"]', "Add Diagnosis");
    return this;
  }

  addDiagnosis(details: DiagnosisDetails) {
    const { diagnosisName } = details;
    cy.get('[data-cy="add-diagnoses"]').scrollIntoView();
    cy.typeAndSelectOption('[data-cy="add-diagnoses"]', diagnosisName, false);
    cy.verifyAndClickElement('[data-cy="add-diagnosis"]', "Add Diagnosis");
    return this;
  }

  updateDiagnosis(details: DiagnosisDetails) {
    const { verification, status, notes } = details;
    if (verification) {
      cy.get('[data-cy="diagnosis-verification"]').last().scrollIntoView();
      cy.clickAndSelectOption(
        '[data-cy="diagnosis-verification"]',
        verification,
        {
          position: "last",
        },
      );
    }
    if (status) {
      cy.get('[data-cy="diagnosis-status"]').last().scrollIntoView();
      cy.clickAndSelectOption('[data-cy="diagnosis-status"]', status, {
        position: "last",
      });
    }
    if (notes) {
      cy.get('[data-cy="diagnosis-options"]').last().click();
      cy.get('[data-cy="add-diagnosis-notes"]').last().click();
      cy.typeIntoField('[data-cy="diagnosis-notes"]', notes, {
        position: "last",
        skipVerification: true,
      });
    }
    return this;
  }

  deleteDiagnosis() {
    cy.get('[data-cy="diagnosis-verification"]').last().scrollIntoView();
    cy.clickAndSelectOption(
      '[data-cy="diagnosis-verification"]',
      "Entered in Error",
      {
        position: "last",
      },
    );

    return this;
  }

  verifyDiagnosisDelete(name: string) {
    cy.get('[data-cy="diagnoses-table"]').then(($el) => {
      cy.wrap($el).should("not.contain", name);
    });
    return this;
  }

  verifyDiagnoses(details: DiagnosisDetails) {
    const { diagnosisName, verification, status, notes } = details;
    cy.verifyContentPresence('[data-cy="diagnoses-table"]', [
      diagnosisName,
      verification,
      status,
    ]);

    if (notes) {
      cy.get('[data-cy="diagnosis-see-note"]').last().scrollIntoView();
      cy.get('[data-cy="diagnosis-see-note"]').last().click();
      cy.get('[data-cy="diagnosis-note"]').last().should("contain", notes);
    }

    return this;
  }

  clickUpdateEncounter() {
    cy.verifyAndClickElement(
      '[data-cy="update-encounter-option"]',
      "Update Encounter",
    );
    return this;
  }

  verifyEncounterPatientInfo(contents: string[]) {
    cy.verifyContentPresence("#patient-infobadges", contents);
    return this;
  }

  // Questionnaire actions
  addQuestionnaire(questionnaireName: string) {
    cy.typeAndSelectOption(
      '[data-cy="add-questionnaire-button"]',
      questionnaireName,
      false,
    );
    return this;
  }

  fillQuestionnaire(answers: Record<string, string>) {
    Object.entries(answers).forEach(([field, value]) => {
      // Handle both text inputs and select dropdowns
      cy.get(`[data-cy="question-${field}"]`).then(($el) => {
        if ($el.is("select")) {
          cy.wrap($el).select(value);
        } else {
          // Find the actual input element within the container
          cy.wrap($el).find("input, textarea").click().type(value);
        }
      });
    });
    return this;
  }

  verifyOverviewValues(expectedValues: string[]) {
    cy.verifyContentPresence('[data-cy="encounter-overview"]', expectedValues);
    return this;
  }

  clickPatientDetailsButton() {
    cy.get('[data-cy="patient-details-button"]')
      .filter(":visible")
      .first()
      .click();
    return this;
  }

  clickPatientEditButton() {
    cy.verifyAndClickElement('[data-cy="edit-patient-button"]', "Edit");
    return this;
  }

  clickEncounterMarkAsComplete() {
    cy.verifyAndClickElement(
      '[data-cy="mark-encounter-complete"]',
      "Mark as Complete",
    );
    return this;
  }

  clickConfirmEncounterAsComplete() {
    cy.intercept("GET", "**/api/v1/encounter/**").as("getEncounter");
    cy.verifyAndClickElement(
      '[data-cy="confirm-encounter-complete"]',
      "Mark as Complete",
    );
    cy.wait("@getEncounter").then((interception) => {
      expect(interception.response?.statusCode).to.eq(200); // Verify status code
      expect(interception.response?.body).to.have.property(
        "status",
        "completed",
      );
    });
    return this;
  }

  assertEncounterCompleteSuccess() {
    cy.verifyNotification("Encounter Complete");
    return this;
  }

  clickInProgressEncounterFilter() {
    cy.intercept("GET", "**/api/v1/encounter/**").as("getEncounters");
    cy.verifyAndClickElement('[data-cy="in-progress-filter"]', "In Progress");
    cy.wait("@getEncounters").its("response.statusCode").should("eq", 200);
    return this;
  }
}
