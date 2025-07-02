interface AllergyDetails {
  allergyName?: string;
  criticality?: string;
  status?: string;
}

interface DiagnosisDetails {
  diagnosisName?: string;
  status?: string;
  verification?: string;
}

interface SymptomDetails {
  symptomName?: string;
  severity?: string;
  status?: string;
  verification?: string;
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

  clickAndSelectClinical(selector: JQuery, reference: string) {
    cy.wrap(selector).scrollIntoView().click();
    cy.get('[role="listbox"]')
      .find('[role="option"]')
      .contains(reference)
      .should("be.visible")
      .click();
    return this;
  }

  clickAddAllergy() {
    cy.intercept("GET", "**/allergy_intolerance/**").as("getAllergies");

    cy.verifyAndClickElement('[data-slot="button"]', "Add Allergy");

    cy.wait("@getAllergies").its("response.statusCode").should("eq", 200);
    return this;
  }

  addAllergy(details: AllergyDetails) {
    const { allergyName } = details;
    cy.contains("button", /Add (another )?Allergy/i)
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
    const { allergyName, criticality, status } = details;

    cy.wait(200);

    cy.get("[data-slot='table-row']")
      .filter((_, el) => getComputedStyle(el).pointerEvents !== "none")
      .contains(allergyName)
      .should("be.visible")
      .within(() => {
        cy.get("[data-slot='select-trigger']").first().scrollIntoView();
        cy.clickAndSelectOption('[data-slot="select-trigger"]', criticality, {
          position: "first",
        });
        cy.get("[data-slot='select-trigger']").last().scrollIntoView();
        cy.clickAndSelectOption('[data-slot="select-trigger"]', status, {
          position: "last",
        });
      });

    return this;
  }

  deleteAllergy(allergyName: string) {
    cy.wait(300);
    cy.get("[data-slot='table-row']")
      .filter((_, el) => getComputedStyle(el).pointerEvents !== "none")
      .contains(allergyName)
      .should("be.visible")
      .within(() => {
        cy.get("[data-slot='dropdown-menu-trigger']").scrollIntoView().click();
      });

    cy.get("[data-slot='dropdown-menu-item']")
      .contains("Remove Allergy")
      .should("be.visible")
      .click();

    return this;
  }

  verifyAllergy(details: AllergyDetails) {
    const { allergyName, criticality, status } = details;
    cy.get("table").scrollIntoView();
    cy.verifyContentPresence("table", [allergyName, criticality, status]);

    return this;
  }

  clickAddSymptoms() {
    cy.intercept("GET", "**/symptom/**").as("getSymptoms");

    cy.verifyAndClickElement('[data-slot="button"]', "Add Symptoms");

    cy.wait("@getSymptoms").its("response.statusCode").should("eq", 200);
    return this;
  }

  addSymptoms(details: SymptomDetails) {
    const { symptomName } = details;
    cy.contains("button", /Add (another )?Symptom/i)
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
  clickAndSelectSymptomOption(position: number, value: string) {
    cy.get("[data-slot='select-trigger']")
      .eq(position)
      .scrollIntoView()
      .click();
    cy.get('[role="listbox"]')
      .find('[role="option"]')
      .contains(value)
      .should("be.visible")
      .click();
    return this;
  }
  updateSymptom(details: SymptomDetails) {
    const { symptomName, severity, status, verification } = details;

    cy.wait(200);

    cy.get("[data-slot='table-row']")
      .filter((_, el) => getComputedStyle(el).pointerEvents !== "none")
      .contains(symptomName)
      .should("be.visible")
      .within(() => {
        this.clickAndSelectSymptomOption(0, status);
        this.clickAndSelectSymptomOption(1, severity);
        this.clickAndSelectSymptomOption(2, verification);
      });

    return this;
  }

  deleteSymptom(symptomName: string) {
    cy.wait(300);

    cy.get("[data-slot='table-row']")
      .filter((_, el) => getComputedStyle(el).pointerEvents !== "none")
      .contains(symptomName)
      .should("be.visible")
      .within(() => {
        cy.get("[data-slot='dropdown-menu-trigger']").scrollIntoView().click();
      });

    cy.get("[data-slot='dropdown-menu-item']")
      .contains("Remove Symptom")
      .should("be.visible")
      .click();

    return this;
  }

  verifySymptom(details: SymptomDetails) {
    const { symptomName, severity, status } = details;
    cy.get("table").scrollIntoView();
    cy.verifyContentPresence("table", [symptomName, severity, status]);

    return this;
  }

  clickAddDiagnosis() {
    cy.intercept("GET", "**/diagnosis/**").as("getDiagnosis");

    cy.verifyAndClickElement('[data-slot="button"]', "Add Diagnosis");

    cy.wait("@getDiagnosis").its("response.statusCode").should("eq", 200);
    return this;
  }

  addDiagnosis(details: DiagnosisDetails) {
    const { diagnosisName } = details;
    cy.contains("button", /Add (another )?Diagnosis/i)
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
    const { diagnosisName, verification, status } = details;

    cy.wait(200);

    cy.get("[data-slot='table-row']")
      .filter((_, el) => getComputedStyle(el).pointerEvents !== "none")
      .contains(diagnosisName)
      .should("be.visible")
      .within(() => {
        cy.get("[data-slot='select-trigger']").first().scrollIntoView();
        cy.clickAndSelectOption('[data-slot="select-trigger"]', status, {
          position: "first",
        });
        cy.get("[data-slot='select-trigger']").last().scrollIntoView();
        cy.clickAndSelectOption('[data-slot="select-trigger"]', verification, {
          position: "last",
        });
      });

    return this;
  }

  deleteDiagnosis(diagnosisName: string) {
    cy.wait(300);

    cy.get("[data-slot='table-row']")
      .filter((_, el) => getComputedStyle(el).pointerEvents !== "none")
      .contains(diagnosisName)
      .should("be.visible")
      .within(() => {
        cy.get("[data-slot='dropdown-menu-trigger']").scrollIntoView().click();
      });

    cy.get("[data-slot='dropdown-menu-item']")
      .contains("Remove Diagnosis")
      .should("be.visible")
      .click();

    return this;
  }

  verifyDuplicateDiagnosis(diagnosisName: string) {
    this.addDiagnosis({ diagnosisName });
    cy.verifyNotification("Diagnosis already exists!");
    return this;
  }

  verifyItemDelete(name: string) {
    cy.get("body").then(($body) => {
      if ($body.find("table").length > 0) {
        cy.get("table").scrollIntoView().should("not.contain", name);
      } else {
        cy.log("Table not found — allergy is deleted, as expected");
      }
    });
    return this;
  }

  verifyDiagnoses(details: DiagnosisDetails) {
    const { diagnosisName, verification, status } = details;
    cy.get("table").scrollIntoView();
    cy.verifyContentPresence("table", [diagnosisName, verification, status]);

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
