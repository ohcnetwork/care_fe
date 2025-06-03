export interface SpecimenDefinitionData {
  title?: string;
  slug: string;
  description?: string;
  status?: string;
  derivedFromUri?: string;
  typeCollected?: string;
  collection?: string;
  patientPreparation?: string;
  testedPreference?: string;
  retentionTime?: string;
  requirement?: string;
  containerDescription?: string;
  cap?: string;
  capacity?: string;
  minimumVolume?: string;
  preparation?: string;
}

export class FacilitySpecimen {
  verifySpecimenDetails(data: Partial<SpecimenDefinitionData>) {
    const detailsToVerify = [
      data.description,
      data.status,
      data.typeCollected,
      data.derivedFromUri,
      data.cap,
    ].filter(Boolean);

    cy.verifyContentPresenceV2("card", detailsToVerify);
    return this;
  }

  fillSpecimenDefinitionForm(data: SpecimenDefinitionData) {
    if (data.title) {
      cy.typeIntoLabeledField("Title", data.title, true);
    }
    cy.typeIntoLabeledField("Slug", data.slug);

    if (data.description) {
      cy.typeIntoLabeledField("Description", data.description, true);
    }
    if (data.status) {
      cy.clickAndSelectOptionV2("Status", data.status);
    }
    if (data.derivedFromUri) {
      cy.typeIntoLabeledField("Derived From URI", data.derivedFromUri, true);
    }
    if (data.typeCollected) {
      cy.typeAndSelectOptionV2("Type Collected", data.typeCollected);
    }
    if (data.collection) {
      cy.typeAndSelectOptionV2("Collection", data.collection);
    }
    if (data.patientPreparation) {
      cy.clickButton("Add");
      cy.typeAndSelectOptionV2("Patient Preparation", data.patientPreparation);
    }
    if (data.testedPreference) {
      cy.clickAndSelectOptionV2("Preference", data.testedPreference);
    }
    if (data.retentionTime) {
      cy.selectComboboxDropdown("Retention time", data.retentionTime);
    }
    if (data.requirement) {
      cy.typeIntoLabeledField("Requirement", data.requirement, true);
    }
    if (data.containerDescription) {
      cy.typeIntoField(
        '[data-cy="specimen-definition-form-container-description"]',
        data.containerDescription,
        {
          clearBeforeTyping: true,
        },
      );
    }
    if (data.cap) {
      cy.typeAndSelectOptionV2("Cap", data.cap);
    }
    if (data.capacity) {
      cy.selectComboboxDropdown("Capacity", data.capacity);
    }
    if (data.minimumVolume) {
      cy.typeIntoField(
        '[data-cy="specimen-definition-form-minimum-volume-string"]',
        data.minimumVolume,
        {
          clearBeforeTyping: true,
        },
      );
    }
    if (data.preparation) {
      cy.typeIntoField(
        '[data-cy="specimen-definition-form-preparation"]',
        data.preparation,
        {
          clearBeforeTyping: true,
        },
      );
    }

    return this;
  }
}
