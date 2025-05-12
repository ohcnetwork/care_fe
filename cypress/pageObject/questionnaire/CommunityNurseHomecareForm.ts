interface SymptomDetails {
  symptom: string;
  status: string;
  severity: string;
  notes: string;
}

interface DiagnosisDetails {
  diagnosis: string;
  status: string;
  verification: string;
  notes: string;
}

interface MedicationStatementDetails {
  medicine: string;
  status: string;
  dosageInstruction: string;
  notes: string;
}

interface AppointmentDetails {
  reasonForVisit: string;
  practitioner: string;
}

export class CommunityQuestionnaireForm {
  private placeholders = {
    appointmentSlot: "Select appointment slot",
  };

  private selectors = {
    // Input type selectors
    input: {
      textArea: '[data-cy="text-area-question-input"]',
      text: '[data-cy="text-input-question-input"]',
      number: '[data-cy="number-question-input"]',
      choice: '[data-cy="choice-question-input"]',
      radioItem: '[data-cy="radio-group-question-item"]',
    },

    // Symptom Selectors
    symptom: {
      addSymptom: '[data-cy="add-symptom"]',
      status: '[data-cy="symptom-status"]',
      severity: '[data-cy="symptom-severity"]',
      actionsMenu: '[data-cy="symptom-actions-menu"]',
      addNotes: '[data-cy="symptom-add-notes"]',
      notes: '[data-cy="symptom-notes"]',
      seeNote: '[data-cy="symptom-see-note"]',
      note: '[data-cy="symptom-note"]',
    },

    // Diagnosis Selectors
    diagnosis: {
      addDiagnosis: '[data-cy="add-diagnosis"]',
      addDiagnosisConfirm: '[data-cy="add-diagnosis-confirm"]',
      status: '[data-cy="diagnosis-status"]',
      verification: '[data-cy="diagnosis-verification"]',
      actionsMenu: '[data-cy="diagnosis-actions-menu"]',
      addNotes: '[data-cy="diagnosis-add-notes"]',
      notes: '[data-cy="diagnosis-notes"]',
      seeNote: '[data-cy="diagnosis-see-note"]',
      note: '[data-cy="diagnosis-note"]',
    },

    //Medication Statement Selectors
    medicationStatement: {
      addMedicationStatement: '[data-cy="add-medication-statement"]',
      status: '[data-cy="medication-statement-status"]',
      dosageInstruction: '[data-cy="medication-statement-dosage-instructions"]',
      notes: '[data-cy="medication-statement-notes"]',
      startDate: '[data-cy="medication-statement-start-date"]',
      endDate: '[data-cy="medication-statement-end-date"]',
      calendar: '[data-cy="calendar-input"]',
    },

    // Appointment Selectors
    appointment: {
      nextVisit: '[data-cy="question-input-15.3"]',
      reasonForVisit: '[data-cy="reason-for-visit"]',
      practitioner: '[data-cy="select-practitioner"]',
      appointmentSlot: '[data-cy="select-appointment-slot"]',
      appointmentButton: '[data-cy="appointment-slot-button"]',
    },
  };

  fillQuestionnaireFields(
    fields: Array<{ linkId: string; value: string; inputType: string }>,
  ) {
    fields.forEach(({ linkId, value, inputType }) => {
      const baseSelector = `[data-cy="question-input-${linkId}"]`;

      switch (inputType) {
        case "textarea":
          cy.typeIntoField(
            `${baseSelector} ${this.selectors.input.textArea}`,
            value,
          );
          break;

        case "text":
          cy.typeIntoField(
            `${baseSelector} ${this.selectors.input.text}`,
            value,
          );
          break;

        case "number":
          cy.typeIntoField(
            `${baseSelector} ${this.selectors.input.number}`,
            value,
          );
          break;

        case "choice":
          cy.clickAndSelectOption(
            `${baseSelector} ${this.selectors.input.choice}`,
            value,
          );
          break;
        case "radio":
          cy.get(`${baseSelector}`)
            .find('[data-cy="radio-group-question-item"]')
            .parent()
            .contains(value)
            .closest("label")
            .click();
          break;

        default:
          cy.log(`Input type ${inputType} not recognized for linkId ${linkId}`);
          break;
      }
    });

    return this;
  }

  verifyValidationErrors() {
    cy.verifyErrorMessages([
      { label: "Route", message: "This field is required" },
      { label: "Issues", message: "This field is required" },
      { label: "Care Plan", message: "This field is required" },
      {
        label: "Frequency of Follow-Up Required",
        message: "This field is required",
      },
      { label: "Next Visit On", message: "This field is required" },
      {
        label: "Was a Teleconsultation Done?",
        message: "This field is required",
      },
    ]);

    return this;
  }

  addSymptom(symptomDetails: SymptomDetails) {
    const { symptom, status, severity, notes } = symptomDetails;

    cy.typeAndSelectOption(this.selectors.symptom.addSymptom, symptom, false);

    cy.clickAndSelectOption(this.selectors.symptom.status, status);
    cy.clickAndSelectOption(this.selectors.symptom.severity, severity);

    this.clickActionMenu(this.selectors.symptom.actionsMenu);
    cy.verifyAndClickElement(this.selectors.symptom.addNotes, "Add notes");
    cy.typeIntoField(this.selectors.symptom.notes, notes);

    return this;
  }

  addDiagnosis(diagnosisDetails: DiagnosisDetails) {
    const { diagnosis, status, verification, notes } = diagnosisDetails;

    cy.typeAndSelectOption(
      this.selectors.diagnosis.addDiagnosis,
      diagnosis,
      false,
    );
    cy.verifyAndClickElement(
      this.selectors.diagnosis.addDiagnosisConfirm,
      "Add Diagnosis",
    );

    cy.clickAndSelectOption(this.selectors.diagnosis.status, status);
    cy.clickAndSelectOption(
      this.selectors.diagnosis.verification,
      verification,
    );

    this.clickActionMenu(this.selectors.diagnosis.actionsMenu);
    cy.verifyAndClickElement(this.selectors.diagnosis.addNotes, "Add notes");
    cy.typeIntoField(this.selectors.diagnosis.notes, notes);

    return this;
  }

  clickActionMenu(menu: string) {
    cy.get(menu).should("be.visible").as("actionsMenu");
    cy.get("@actionsMenu").click();
    return this;
  }

  selectMedicationDate(dateType: "start" | "end" = "start") {
    const selector =
      dateType === "start"
        ? this.selectors.medicationStatement.startDate
        : this.selectors.medicationStatement.endDate;

    cy.verifyAndClickElement(selector, "Pick a date");
    cy.get(this.selectors.medicationStatement.calendar).should("be.visible");

    const elementSelector = dateType === "start" ? "first" : "last";
    cy.get(this.selectors.medicationStatement.calendar)
      [elementSelector]()
      .click();

    return this;
  }

  addMedicationStatement(
    medicationStatementDetails: MedicationStatementDetails,
  ) {
    const { medicine, status, dosageInstruction, notes } =
      medicationStatementDetails;

    cy.typeAndSelectOption(
      this.selectors.medicationStatement.addMedicationStatement,
      medicine,
      false,
    );

    cy.clickAndSelectOption(this.selectors.medicationStatement.status, status);

    cy.typeIntoField(
      this.selectors.medicationStatement.dosageInstruction,
      dosageInstruction,
    );

    this.selectMedicationDate("start");
    this.selectMedicationDate("end");

    cy.typeIntoField(this.selectors.medicationStatement.notes, notes);

    return this;
  }

  selectAppointment(appointmentDetails: AppointmentDetails) {
    const { reasonForVisit, practitioner } = appointmentDetails;

    this.enterVisitReason(reasonForVisit);
    this.selectPractitioner(practitioner);
    this.selectAppointmentSlot();
    return this;
  }

  enterVisitReason(reason: string) {
    cy.typeIntoField(
      `${this.selectors.appointment.nextVisit} ${this.selectors.appointment.reasonForVisit}`,
      reason,
    );
    return this;
  }

  selectPractitioner(name: string) {
    cy.typeAndSelectOption(
      `${this.selectors.appointment.nextVisit} ${this.selectors.appointment.practitioner}`,
      name,
      false,
    );
    return this;
  }

  selectAppointmentSlot() {
    cy.verifyAndClickElement(
      `${this.selectors.appointment.nextVisit} ${this.selectors.appointment.appointmentSlot}`,
      this.placeholders.appointmentSlot,
    );

    cy.get(this.selectors.appointment.appointmentButton)
      .not("[disabled]")
      .first()
      .should("be.visible")
      .click();

    return this;
  }

  interceptQuestionnaireSubmission() {
    cy.intercept("POST", "**/api/v1/batch_requests/").as("batchSubmit");
    return this;
  }

  saveQuestionnaireId() {
    cy.wait("@batchSubmit").then((interception) => {
      const { body } = interception.response || {};
      const results = body?.results || [];

      const responseId =
        results.length > 0 ? results[results.length - 1]?.data?.id : undefined;

      cy.wrap(responseId).as("questionnaireId");
    });
    return this;
  }

  verifyDataPresence(values: string[]) {
    cy.get("@questionnaireId").then((questionnaireId) => {
      cy.verifyContentPresence(
        `[data-cy="questionnaire-response-card-${questionnaireId}"]`,
        values,
      );
    });

    return this;
  }

  verifySymptoms(details: SymptomDetails) {
    const { symptom, status, severity, notes } = details;
    cy.verifyContentPresence('[data-cy="symptoms-table"]', [
      symptom,
      status,
      severity,
    ]);
    this.clickSeeNoteAndVerifyNote(
      this.selectors.symptom.seeNote,
      this.selectors.symptom.note,
      notes,
    );
    return this;
  }

  verifyDiagnosis(details: DiagnosisDetails) {
    const { diagnosis, status, verification, notes } = details;
    cy.verifyContentPresence('[data-cy="diagnosis-table"]', [
      diagnosis,
      status,
      verification,
    ]);
    this.clickSeeNoteAndVerifyNote(
      this.selectors.diagnosis.seeNote,
      this.selectors.diagnosis.note,
      notes,
    );
    return this;
  }

  clickSeeNoteAndVerifyNote(
    buttonSelector: string,
    noteSelector: string,
    note: string,
  ) {
    cy.verifyAndClickElement(buttonSelector, "See Note");
    cy.verifyContentPresence(noteSelector, [note]);
    return this;
  }
}
