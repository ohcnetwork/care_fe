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

    cy.verifyContentPresence('[data-slot="card"]', detailsToVerify);
    return this;
  }

  fillSpecimenDefinitionForm(data: SpecimenDefinitionData) {
    if (data.title) {
      cy.typeIntoField('input[name="title"]', data.title, {
        clearBeforeTyping: true,
      });
    }
    cy.typeIntoField('input[name="slug"]', data.slug, {
      clearBeforeTyping: true,
    });

    if (data.description) {
      cy.typeIntoField('textarea[name="description"]', data.description, {
        clearBeforeTyping: true,
      });
    }
    if (data.status) {
      cy.clickAndSelectOptionV2("Status", data.status);
    }
    if (data.derivedFromUri) {
      cy.typeIntoField('input[name="derived_from_uri"]', data.derivedFromUri, {
        clearBeforeTyping: true,
      });
    }
    if (data.typeCollected) {
      cy.typeAndSelectOptionV2("Type Collected", data.typeCollected);
    }
    if (data.collection) {
      cy.typeAndSelectOptionV2("Collection", data.collection);
    }
    if (data.patientPreparation) {
      cy.get("button").contains("Add").click();
      cy.typeAndSelectOptionV2("Patient Preparation", data.patientPreparation);
    }
    if (data.testedPreference) {
      cy.clickAndSelectOptionV2("Preference", data.testedPreference);
    }
    if (data.retentionTime) {
      cy.selectComboboxDropdown("Retention time", data.retentionTime);
    }
    if (data.requirement) {
      cy.typeIntoField(
        'textarea[name="type_tested.requirement"]',
        data.requirement,
        {
          clearBeforeTyping: true,
        },
      );
    }
    if (data.containerDescription) {
      cy.typeIntoField(
        'textarea[name="type_tested.container.description"]',
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
        'input[name="type_tested.container.minimum_volume.string"]',
        data.minimumVolume,
        {
          clearBeforeTyping: true,
        },
      );
    }
    if (data.preparation) {
      cy.typeIntoField(
        'textarea[name="type_tested.container.preparation"]',
        data.preparation,
        {
          clearBeforeTyping: true,
        },
      );
    }

    return this;
  }
}
