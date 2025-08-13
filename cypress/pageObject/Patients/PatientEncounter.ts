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

  clickUpdateEncounter() {
    cy.get("a:contains('Update Encounter')").filter(":visible").click();
    return this;
  }

  verifyEncounterPatientInfo(contents: string[]) {
    cy.verifyContentPresence("#root", contents);
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
    cy.verifyContentPresence("#root", expectedValues);
    return this;
  }

  clickPatientDetailsButton() {
    cy.get("svg.lucide-external-link").filter(":visible").first().click();
    return this;
  }

  clickPatientEditButton() {
    cy.verifyAndClickElement('[data-cy="edit-patient-button"]', "Edit");
    return this;
  }

  clickEncounterMarkAsComplete() {
    cy.get("button[data-slot='tabs-trigger']")
      .filter(":visible")
      .contains("Actions")
      .click();
    cy.get("button").contains("Mark as completed").click();
    return this;
  }

  clickConfirmEncounterAsComplete() {
    cy.intercept("GET", "**/api/v1/encounter/**").as("getEncounter");
    cy.get("div[data-slot='alert-dialog-footer']")
      .contains("Mark as complete")
      .click();
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
    cy.get('button:contains("In Progress")').click();
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
