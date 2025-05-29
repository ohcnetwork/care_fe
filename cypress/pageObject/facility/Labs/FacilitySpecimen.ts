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
  navigateToSpecimenDefinitions() {
    cy.get('[data-sidebar="menu-button"]').contains("Settings").click();
    cy.get('[data-sidebar="menu-sub-button"]')
      .contains("Specimen Definitions")
      .click();
    cy.url().should("include", "/settings/specimen_definitions");
    return this;
  }

  // List page methods
  clickAddDefinition() {
    cy.clickButton("Add Definition");
    cy.url().should("include", "/settings/specimen_definitions/new");
    return this;
  }

  searchSpecimen(title: string) {
    cy.typeIntoInputByPlaceholder("Search definitions", title);
    return this;
  }

  filterByStatus(status: string) {
    cy.clickSelectTrigger("Status", status);
    return this;
  }

  verifySpecimenInList(title: string) {
    cy.verifyContentPresenceV2("table", [title]);
    return this;
  }

  openSpecimenDetails() {
    cy.get('[data-slot="table-cell"]').contains("See Details").first().click();
    return this;
  }

  // Detail page methods
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

  clickEditSpecimen() {
    cy.clickButton("Edit");
    return this;
  }

  // Form methods
  verifyRequiredFieldErrors() {
    cy.verifyErrorMessages([
      { message: "Title is required", label: "Title" },
      { message: "Slug is required", label: "Slug" },
      {
        message: "String must contain at least 1 character(s)",
        label: "Description",
      },
      { message: "Required", label: "Type Collected" },
    ]);
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

  saveSpecimenDefinition() {
    cy.clickButton("Save");
    return this;
  }

  verifySpecimenDefinitionsUrl() {
    cy.url().should("include", "/settings/specimen_definitions");
    return this;
  }

  verifySpecimenCreatedNotification() {
    cy.verifyNotification("Specimen definition created");
    return this;
  }

  verifySpecimenUpdatedNotification() {
    cy.verifyNotification("Specimen Definition updated");
    return this;
  }

  clickDeleteSpecimen() {
    cy.clickButton("Delete");
    return this;
  }

  confirmDeleteSpecimen() {
    cy.clickButton("Confirm");
    return this;
  }

  verifySpecimenRetiredNotification() {
    cy.verifyNotification("Specimen definition retired successfully");
    return this;
  }
}
