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
      .contains("View Encounter")
      .click();
    return this;
  }

  searchEncounter(patientName: string) {
    cy.get('[data-cy="search-encounter"]').click();
    cy.typeIntoField('[data-cy="encounter-search"]', patientName);
    cy.get('[data-cy="search-encounter"]').click();
    return this;
  }

  clickAddAllergy() {
    cy.intercept("GET", "**/allergy_intolerance/**").as("getAllergies");

    cy.contains("a", "Add Allergy")
      .then(($el) => {
        $el.attr("data-cy", "add-allergy-button");
      })
      .then(() => {
        cy.verifyAndClickElement(
          '[data-cy="add-allergy-button"]',
          "Add Allergy",
        );
      });

    cy.wait("@getAllergies").its("response.statusCode").should("eq", 200);
    return this;
  }

  addAllergy(details: AllergyDetails) {
    const { allergyName } = details;
    cy.contains("button", "Add another Allergy")
      .scrollIntoView()
      .as("allergyButton")
      .then(($el) => {
        $el.attr("data-cy", "add-allergy");
      })
      .then(() => {
        cy.typeAndSelectOption('[data-cy="add-allergy"]', allergyName, false);
      });

    return this;
  }

  updateAllergy(details: AllergyDetails) {
    const { criticality, status } = details;
    cy.wait(200);

    cy.get("tr")
      .filter((_, el) => getComputedStyle(el).pointerEvents !== "none")
      .first()
      .find("td")
      .then(($tds) => {
        const criticality = $tds.eq(1);
        const status = $tds.eq(2);
        criticality.attr("data-cy", "allergy-criticality");
        status.attr("data-cy", "allergy-status");
      });

    cy.get('[data-cy="allergy-criticality"]').first().scrollIntoView();
    cy.clickAndSelectOption('[data-cy="allergy-criticality"]', criticality, {
      position: "first",
    });

    cy.get('[data-cy="allergy-status"]').first().scrollIntoView();
    cy.clickAndSelectOption('[data-cy="allergy-status"]', status, {
      position: "first",
    });

    return this;
  }

  deleteAllergy() {
    cy.wait(300);
    cy.get("tr")
      .last()
      .find("td")
      .then(($tds) => {
        $tds.eq(4).attr("data-cy", "allergy-options");
      });
    cy.get('[data-cy="allergy-options"]')
      .scrollIntoView()
      .should("be.visible")
      .then(($el) => {
        cy.wrap($el).click();
        cy.contains("button", "Remove Allergy").click();
      });

    return this;
  }

  verifyAllergyDelete(name: string) {
    cy.get('div:contains("Allergies")').scrollIntoView();
    cy.get('div:contains("Allergies")').then(($el) => {
      cy.wrap($el).should("not.contain", name);
    });
    return this;
  }

  verifyAllergy(details: AllergyDetails) {
    const { allergyName, criticality, status } = details;
    cy.get('div:contains("Allergies")').scrollIntoView();
    cy.verifyContentPresence('div:contains("Allergies")', [
      allergyName,
      criticality,
      status,
    ]);

    return this;
  }

  clickAddSymptoms() {
    cy.intercept("GET", "**/symptom/**").as("getSymptoms");

    cy.contains("a", "Add Symptoms")
      .then(($el) => {
        $el.attr("data-cy", "add-symptoms-button");
      })
      .then(() => {
        cy.verifyAndClickElement(
          '[data-cy="add-symptoms-button"]',
          "Add Symptoms",
        );
      });

    cy.wait("@getSymptoms").its("response.statusCode").should("eq", 200);
    return this;
  }

  addSymptoms(details: SymptomDetails) {
    const { symptomName } = details;
    cy.contains("button", "Add another Symptom")
      .scrollIntoView()
      .as("symptomButton")
      .then(($el) => {
        $el.attr("data-cy", "add-symptom");
      })
      .then(() => {
        cy.typeAndSelectOption('[data-cy="add-symptom"]', symptomName, false);
      });

    return this;
  }
  verifyDuplicateSymptom(symptomName: string) {
    this.addSymptoms({ symptomName });
    cy.verifyNotification("Symptom already exists!");
    return this;
  }
  updateSymptom(details: SymptomDetails) {
    const { severity, status } = details;
    cy.wait(200);

    cy.get("tr")
      .filter((_, el) => getComputedStyle(el).pointerEvents !== "none")
      .last()
      .find("td")
      .then(($tds) => {
        const status = $tds.eq(1);
        const severity = $tds.eq(2);
        status.attr("data-cy", "symptom-status");
        severity.attr("data-cy", "symptom-severity");
      });

    cy.get('[data-cy="symptom-severity"]').scrollIntoView();
    cy.clickAndSelectOption('[data-cy="symptom-severity"]', severity);

    cy.get('[data-cy="symptom-status"]').scrollIntoView();
    cy.clickAndSelectOption('[data-cy="symptom-status"]', status);

    return this;
  }

  deleteSymptom() {
    cy.wait(300);
    cy.get("tr")
      .last()
      .find("td")
      .then(($tds) => {
        $tds.eq(4).attr("data-cy", "symptom-options");
      });
    cy.get('[data-cy="symptom-options"]')
      .scrollIntoView()
      .should("be.visible")
      .then(($el) => {
        cy.wrap($el).click();
        cy.contains("button", "Remove Symptom").click();
      });
    return this;
  }

  verifySymptomDelete(name: string) {
    cy.get('div:contains("Symptoms")').scrollIntoView();
    cy.get('div:contains("Symptoms")').then(($el) => {
      cy.wrap($el).should("not.contain", name);
    });
    return this;
  }

  verifySymptom(details: SymptomDetails) {
    const { symptomName, severity, status } = details;
    cy.get('div:contains("Symptoms")').scrollIntoView();
    cy.verifyContentPresence('div:contains("Symptoms")', [
      symptomName,
      severity,
      status,
    ]);

    return this;
  }

  clickAddDiagnosis() {
    cy.intercept("GET", "**/diagnosis/**").as("getDiagnosis");

    cy.contains("a", "Add Diagnosis")
      .then(($el) => {
        $el.attr("data-cy", "add-diagnosis-button");
      })
      .then(() => {
        cy.verifyAndClickElement(
          '[data-cy="add-diagnosis-button"]',
          "Add Diagnosis",
        );
      });

    cy.wait("@getDiagnosis").its("response.statusCode").should("eq", 200);
    return this;
  }

  addDiagnosis(details: DiagnosisDetails) {
    const { diagnosisName } = details;
    cy.contains("button", "Add another Diagnosis")
      .scrollIntoView()
      .as("diagnosisButton")
      .then(($el) => {
        $el.attr("data-cy", "add-diagnosis");
      })
      .then(() => {
        cy.typeAndSelectOption(
          '[data-cy="add-diagnosis"]',
          diagnosisName,
          false,
        );
      });

    return this;
  }

  updateDiagnosis(details: DiagnosisDetails) {
    const { verification, status, notes } = details;
    cy.wait(200);
    cy.get("tr")
      .last()
      .find("td")
      .then(($tds) => {
        const status = $tds.eq(2);
        const severity = $tds.eq(3);
        const options = $tds.eq(4);
        status.attr("data-cy", "diagnosis-status");
        severity.attr("data-cy", "diagnosis-verification");
        options.attr("data-cy", "diagnosis-options");
      });

    cy.get('[data-cy="diagnosis-verification"]').scrollIntoView();
    cy.clickAndSelectOption('[data-cy="diagnosis-verification"]', verification);

    cy.get('[data-cy="diagnosis-status"]').scrollIntoView();
    cy.clickAndSelectOption('[data-cy="diagnosis-status"]', status);

    cy.get('[data-cy="diagnosis-options"]').click();
    cy.contains("button", "Add notes").click();

    cy.typeIntoField('input[placeholder="Enter additional notes"]', notes, {
      skipVerification: true,
      position: "last",
    });

    return this;
  }

  deleteDiagnosis() {
    cy.wait(300);
    cy.get("tr")
      .last()
      .find("td")
      .then(($tds) => {
        $tds.eq(4).attr("data-cy", "diagnosis-options");
      });
    cy.get('[data-cy="diagnosis-options"]')
      .scrollIntoView()
      .should("be.visible")
      .then(($el) => {
        cy.wrap($el).click();
        cy.contains("button", "Remove Diagnosis").click();
      });
    return this;
  }

  verifyDuplicateDiagnosis(diagnosisName: string) {
    this.addDiagnosis({ diagnosisName });
    cy.verifyNotification("Diagnosis already exists!");
    return this;
  }

  verifyDiagnosisDelete(name: string) {
    cy.get('div:contains("Diagnoses")').scrollIntoView();
    cy.get('div:contains("Diagnoses")').then(($el) => {
      cy.wrap($el).should("not.contain", name);
    });
    return this;
  }

  verifyDiagnoses(details: DiagnosisDetails) {
    const { diagnosisName, verification, status } = details;
    cy.get('div:contains("Diagnoses")').scrollIntoView();
    cy.verifyContentPresence('div:contains("Diagnoses")', [
      diagnosisName,
      verification,
      status,
    ]);

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

  getPatientPhone() {
    cy.get('[data-cy="patient-phone-input"]').invoke("val").as("patientPhone");
    return this;
  }

  getPatientName() {
    cy.get('[data-cy="patient-name-input"]').invoke("val").as("patientName");
    return this;
  }

  getPatientYear() {
    cy.get("body").then(($body) => {
      if ($body.find('[data-cy="dob-year-input"]').length > 0) {
        cy.get('[data-cy="dob-year-input"]').invoke("val").as("patientYear");
      } else {
        cy.get('[data-cy="year-of-birth"]')
          .invoke("text")
          .then((text) => {
            const year = text.match(/\d+/)?.[0];
            cy.wrap(year).as("patientYear");
          });
      }
    });
    return this;
  }
}
