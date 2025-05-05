export interface ResourceRequestFormData {
  title: string;
  status: string;
  category: string;
  reason: string;
  assignedUser: string;
  facility: string;
  sourceFacility: string;
}

export class ResourcesCreation {
  selectFacility(facility: string) {
    cy.typeAndSelectOption('[data-cy="select-facility"]', facility, false);
    return this;
  }

  selectStatus(status: string) {
    cy.clickAndSelectOption('[data-cy="select-status-dropdown"]', status);
    return this;
  }

  selectCategory(category: string) {
    cy.clickAndSelectOption('[data-cy="select-category-dropdown"]', category);
    return this;
  }

  selectAssignedUser(user: string) {
    cy.typeAndSelectOption('[data-cy="select-assigned-user"]', user, false);
    return this;
  }

  enterTitle(title: string) {
    cy.typeIntoField('[data-cy="title-input"]', title, {
      clearBeforeTyping: true,
    });
    return this;
  }

  enterReason(reason: string) {
    cy.typeIntoField('[data-cy="reason-input"]', reason, {
      clearBeforeTyping: true,
    });
    return this;
  }

  autoFillDetails() {
    cy.verifyAndClickElement(
      '[data-cy="fill_my_details_button"]',
      "Fill My Details",
    );
    return this;
  }

  verifyAutoFillDetails(selector: string, value: string) {
    cy.get(selector).should("have.value", value);
    return this;
  }

  fillResourceRequestForm(data: ResourceRequestFormData) {
    this.selectFacility(data.facility)
      .selectStatus(data.status)
      .selectCategory(data.category)
      .enterTitle(data.title)
      .enterReason(data.reason)
      .autoFillDetails()
      .verifyAutoFillDetails('[data-cy="contact_person"]', "Dev Nurse")
      .verifyAutoFillDetails(
        '[data-cy="contact_person_phone"]',
        "+91 98767 57676",
      );
    return this;
  }

  submitForm() {
    cy.clickSubmitButton("Submit");
    return this;
  }

  interceptCreateRequest() {
    cy.intercept("POST", "**/api/v1/resource/").as("createResource");
    return this;
  }

  interceptUpdateRequest() {
    cy.intercept("PUT", "**/api/v1/resource/**").as("updateResource");
    return this;
  }

  verifyCreateRequest() {
    cy.wait("@createResource").then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });
    return this;
  }

  verifyUpdateRequest() {
    cy.wait("@updateResource").then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });
    return this;
  }

  assertCreationSuccess() {
    cy.verifyNotification("Request created successfully");
    return this;
  }

  assertUpdateSuccess() {
    cy.verifyNotification("Resource updated successfully");
    return this;
  }

  searchResource(title: string) {
    cy.get('[data-cy="search-resource"]').click();
    cy.typeIntoField("#resource-search", title);
    cy.get('[data-cy="search-resource"]').click();
    return this;
  }

  verifyResourceInPatientPage(data: ResourceRequestFormData) {
    cy.verifyContentPresence("[data-cy='resource-requests-table']", [
      data.category,
      data.title,
      data.status,
    ]);
    return this;
  }

  verifyResourceCardDetails(data: ResourceRequestFormData) {
    cy.verifyContentPresence('[data-cy="resource-card-0"]', [
      data.title,
      data.reason,
      data.category,
      data.sourceFacility,
      data.facility,
      "View Details",
    ]);
    return this;
  }

  navigateToResources() {
    cy.verifyAndClickElement('[data-sidebar="content"]', "Resource");
    return this;
  }

  updateResourceStatus() {
    cy.verifyAndClickElement(
      '[data-cy="update-status-button"]',
      "Update Status",
    );
    return this;
  }

  openResourceDetails() {
    cy.verifyAndClickElement(
      '[data-cy="resource-view-details-0"]',
      "View Details",
    );
    return this;
  }

  applyFilter(name: string) {
    cy.get(`[data-cy='tab-${name}']`).click();
    return this;
  }
}
