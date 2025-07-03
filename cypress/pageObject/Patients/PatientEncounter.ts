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

  clickAddAllergy() {
    cy.intercept("GET", "**/allergy_intolerance/**").as("getAllergies");

    cy.get('[data-slot="button"]')
      .contains("Add Allergy")
      .scrollIntoView()
      .click();

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

    cy.wait(400);

    cy.get("[data-slot='table-row']")
      .filter((_, row) => {
        return Array.from(row.querySelectorAll("td")).some((td) =>
          td.textContent.includes(allergyName),
        );
      })
      .first()
      .should("be.visible")
      .within(() => {
        this.clickAndSelectOption(1, criticality);
        this.clickAndSelectOption(2, status);
      });

    return this;
  }

  deleteAllergy(allergyName: string) {
    cy.wait(400);
    cy.get("[data-slot='table-row']")
      .filter((_, row) => {
        return Array.from(row.querySelectorAll("td")).some((td) =>
          td.textContent.includes(allergyName),
        );
      })
      .first()
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
    const texts = [allergyName, criticality, status];

    cy.get("table").first().scrollIntoView();
    cy.get("table")
      .first()
      .then(($el) => {
        texts.forEach((text) => {
          cy.wrap($el).should("contain", text);
        });
      });

    return this;
  }

  clickAddSymptoms() {
    cy.intercept("GET", "**/symptom/**").as("getSymptoms");

    cy.get('[data-slot="button"]')
      .contains("Add Symptoms")
      .scrollIntoView()
      .click();

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
  clickAndSelectOption(position: number, value: string) {
    cy.get("[data-slot='select-trigger']")
      .eq(position)
      .should("be.enabled")
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

    cy.wait(400);

    cy.get("[data-slot='table-row']")
      .filter((_, row) => {
        return Array.from(row.querySelectorAll("td")).some((td) =>
          td.textContent.includes(symptomName),
        );
      })
      .first()
      .should("be.visible")
      .within(() => {
        this.clickAndSelectOption(0, status);
        this.clickAndSelectOption(1, severity);
        this.clickAndSelectOption(2, verification);
      });

    return this;
  }

  deleteSymptom(symptomName: string) {
    cy.wait(400);

    cy.get("[data-slot='table-row']")
      .filter((_, row) => {
        return Array.from(row.querySelectorAll("td")).some((td) =>
          td.textContent.includes(symptomName),
        );
      })
      .first()
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
    cy.get("table").first().scrollIntoView();
    cy.get("table").then(($el) => {
      const texts = [symptomName, severity, status];
      texts.forEach((text) => {
        cy.wrap($el).should("contain", text);
      });
    });

    return this;
  }

  clickAddDiagnosis() {
    cy.intercept("GET", "**/diagnosis/**").as("getDiagnosis");

    cy.get('[data-slot="button"]')
      .contains("Add Diagnosis")
      .scrollIntoView()
      .click();
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

    cy.wait(400);

    cy.get("[data-slot='table-row']")
      .filter((_, row) => {
        return Array.from(row.querySelectorAll("td")).some((td) =>
          td.textContent.includes(diagnosisName),
        );
      })
      .first()
      .should("be.visible")
      .within(() => {
        this.clickAndSelectOption(0, status);
        this.clickAndSelectOption(1, verification);
      });

    return this;
  }

  deleteDiagnosis(diagnosisName: string) {
    cy.wait(400);

    cy.get("[data-slot='table-row']")
      .filter((_, row) => {
        return Array.from(row.querySelectorAll("td")).some((td) =>
          td.textContent.includes(diagnosisName),
        );
      })
      .first()
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
    cy.get("table").first().scrollIntoView().should("not.contain", name);
    return this;
  }

  verifyDiagnoses(details: DiagnosisDetails) {
    const { diagnosisName, verification, status } = details;
    cy.get("table").first().scrollIntoView();
    cy.get("table").then(($el) => {
      const texts = [diagnosisName, verification, status];
      texts.forEach((text) => {
        cy.wrap($el).should("contain", text);
      });
    });

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
