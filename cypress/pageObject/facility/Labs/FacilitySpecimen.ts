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
  // Organize selectors by feature
  private readonly selectors = {
    navigation: {
      settings: '[data-cy="nav-settings"]',
      specimenDefinitions: '[data-cy="nav-specimen-definitions"]',
    },
    list: {
      addButton: '[data-cy="add-specimen-definition-btn"]',
      searchInput: '[data-cy="specimen-definition-search-input"]',
      statusFilter: '[data-cy="specimen-definition-filters"]',
      titleCell: '[data-cy="specimen-definition-title-cell"]',
      detailsButton: '[data-cy="specimen-definition-see-details-btn"]',
      tableContainer: '[data-cy="specimen-definition-table-container"]',
    },
    detail: {
      container: '[data-cy="specimen-definition-detail-page"]',
      editButton: '[data-cy="specimen-definition-edit-btn"]',
      deleteButton: '[data-cy="specimen-definition-delete-btn"]',
      deleteConfirmButton: '[data-cy="specimen-definition-delete-confirm-btn"]',
    },
    form: {
      title: '[data-cy="specimen-definition-form-title"]',
      slug: '[data-cy="specimen-definition-form-slug"]',
      description: '[data-cy="specimen-definition-form-description"]',
      status: '[data-cy="specimen-definition-form-status"]',
      derivedFromUri: '[data-cy="specimen-definition-form-derived-from-uri"]',
      typeCollected: '[data-cy="specimen-definition-form-type-collected"]',
      collection: '[data-cy="specimen-definition-form-collection"]',
      addPatientPreparation: '[data-cy="add-patient-preparation"]',
      selectPatientPreparation: '[data-cy="select-patient-preparation"]',
      testedPreference: '[data-cy="tested-preference"]',
      retentionTime: '[data-cy="specimen-definition-form-retention-time"]',
      requirement: '[data-cy="specimen-definition-form-requirement"]',
      containerDescription:
        '[data-cy="specimen-definition-form-container-description"]',
      cap: '[data-cy="specimen-definition-form-cap"]',
      capacity: '[data-cy="specimen-definition-form-capacity"]',
      minimumVolume:
        '[data-cy="specimen-definition-form-minimum-volume-string"]',
      preparation: '[data-cy="specimen-definition-form-preparation"]',
      saveButton: '[data-cy="save-button"]',
    },
  };

  // Navigation methods
  navigateToSpecimenDefinitions() {
    cy.get(this.selectors.navigation.settings).click();
    cy.verifyAndClickElement(
      this.selectors.navigation.specimenDefinitions,
      "Specimen Definitions",
    );
    cy.url().should("include", "/settings/specimen_definitions");
    return this;
  }

  // List page methods
  clickAddDefinition() {
    cy.verifyAndClickElement(this.selectors.list.addButton, "Add Definition");
    cy.url().should("include", "/settings/specimen_definitions/new");
    return this;
  }

  searchSpecimen(title: string) {
    cy.typeIntoField(this.selectors.list.searchInput, title);
    return this;
  }

  filterByStatus(status: string) {
    cy.clickAndSelectOption(this.selectors.list.statusFilter, status);
    return this;
  }

  verifySpecimenInList(title: string) {
    cy.get(this.selectors.list.titleCell).should("contain", title);
    return this;
  }

  openSpecimenDetails() {
    cy.get(this.selectors.list.tableContainer)
      .find(this.selectors.list.detailsButton)
      .first()
      .click();
    return this;
  }

  // Detail page methods
  verifySpecimenDetails(data: Partial<SpecimenDefinitionData>) {
    const detailsToVerify = [
      data.title,
      data.description,
      data.status,
      data.typeCollected,
      data.derivedFromUri,
      data.cap,
    ].filter(Boolean);

    cy.verifyContentPresence(this.selectors.detail.container, detailsToVerify);
    return this;
  }

  clickEditSpecimen() {
    cy.verifyAndClickElement(this.selectors.detail.editButton, "Edit");
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
    const { form } = this.selectors;

    if (data.title) {
      cy.typeIntoField(form.title, data.title, { clearBeforeTyping: true });
    }
    cy.typeIntoField(form.slug, data.slug, { clearBeforeTyping: true });

    if (data.description) {
      cy.typeIntoField(form.description, data.description, {
        clearBeforeTyping: true,
      });
    }
    if (data.status) {
      cy.clickAndSelectOption(form.status, data.status);
    }
    if (data.derivedFromUri) {
      cy.typeIntoField(form.derivedFromUri, data.derivedFromUri, {
        clearBeforeTyping: true,
      });
    }
    if (data.typeCollected) {
      cy.typeAndSelectOption(form.typeCollected, data.typeCollected);
    }
    if (data.collection) {
      cy.typeAndSelectOption(form.collection, data.collection);
    }
    if (data.patientPreparation) {
      cy.verifyAndClickElement(form.addPatientPreparation, "Add");
      cy.typeAndSelectOption(
        form.selectPatientPreparation,
        data.patientPreparation,
      );
    }
    if (data.testedPreference) {
      cy.clickAndSelectOption(form.testedPreference, data.testedPreference);
    }
    if (data.retentionTime) {
      cy.selectComboboxDropdown(form.retentionTime, data.retentionTime);
    }
    if (data.requirement) {
      cy.typeIntoField(form.requirement, data.requirement, {
        clearBeforeTyping: true,
      });
    }
    if (data.containerDescription) {
      cy.typeIntoField(form.containerDescription, data.containerDescription, {
        clearBeforeTyping: true,
      });
    }
    if (data.cap) {
      cy.typeAndSelectOption(form.cap, data.cap);
    }
    if (data.capacity) {
      cy.selectComboboxDropdown(form.capacity, data.capacity);
    }
    if (data.minimumVolume) {
      cy.typeIntoField(form.minimumVolume, data.minimumVolume, {
        clearBeforeTyping: true,
      });
    }
    if (data.preparation) {
      cy.typeIntoField(form.preparation, data.preparation, {
        clearBeforeTyping: true,
      });
    }

    return this;
  }

  saveSpecimenDefinition() {
    cy.verifyAndClickElement(this.selectors.form.saveButton, "Save");
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
    cy.verifyAndClickElement(this.selectors.detail.deleteButton, "Delete");
    return this;
  }

  confirmDeleteSpecimen() {
    cy.verifyAndClickElement(
      this.selectors.detail.deleteConfirmButton,
      "Confirm",
    );
    return this;
  }

  verifySpecimenRetiredNotification() {
    cy.verifyNotification("Specimen definition retired successfully");
    return this;
  }
}
