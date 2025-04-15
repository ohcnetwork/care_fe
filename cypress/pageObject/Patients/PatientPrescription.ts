interface MedicationDetails {
  medicineName?: string;
  dosage?: string;
  frequency?: string;
  instructions?: string;
  notes?: string;
}

export class PatientPrescription {
  clickMedicinesTab() {
    cy.verifyAndClickElement('[data-cy="tab-medicines"]', "Medicines");
    return this;
  }
  clickEditPrescription() {
    cy.verifyAndClickElement('[data-cy="edit-prescription"]', "Edit");
    return this;
  }
  addMedication(details: MedicationDetails) {
    const { medicineName, dosage, frequency, instructions, notes } = details;

    if (medicineName) {
      cy.typeAndSelectOption(
        '[data-cy="add-medication-request"]',
        medicineName,
        false,
      );
    }

    if (dosage) {
      cy.get('[data-cy="dosage"]').last().click().type(dosage);
      cy.get('[role="option"]').contains(dosage).click();
    }

    if (frequency) {
      cy.clickAndSelectOption('[data-cy="frequency"]', frequency, {
        position: "last",
      });
    }

    if (instructions) {
      cy.clickAndSelectOption('[data-cy="instructions"]', instructions, {
        position: "last",
      });
    }

    if (notes) {
      cy.typeIntoField('[data-cy="notes"]', notes, {
        position: "last",
        skipVerification: true,
      });
    }

    return this;
  }
  verifyMedication(details: MedicationDetails) {
    const { medicineName, dosage, frequency, instructions, notes } = details;
    cy.verifyContentPresence('[data-cy="medications-table"]', [
      medicineName,
      dosage,
      frequency,
      instructions,
      notes,
    ]);
    return this;
  }
  removeMedication() {
    cy.get('[data-cy="remove-medication"]')
      .filter(":visible")
      .not(":disabled")
      .first()
      .click();
    cy.verifyAndClickElement('[data-cy="confirm-remove-medication"]', "Remove");
    return this;
  }
  verifyDeletedMedication(details: MedicationDetails) {
    const { medicineName, dosage, frequency, instructions, notes } = details;

    cy.get('[data-cy="toggle-stopped-medications"]').click();
    cy.verifyContentPresence('[data-cy="medications-table"]', [
      medicineName,
      dosage,
      frequency,
      instructions,
      notes,
    ]);
  }
  submitQuestionnaire() {
    this.clickSubmitQuestionnaire();
    this.verifyQuestionnaireSubmission();
    return this;
  }

  clickSubmitQuestionnaire() {
    cy.clickSubmitButton("Submit");
    return this;
  }

  verifyQuestionnaireSubmission() {
    cy.verifyNotification("Questionnaire submitted successfully");
    return this;
  }
}
