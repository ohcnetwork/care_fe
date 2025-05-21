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
  selectFacility() {
    cy.clickAndSelectOption('[data-cy="select-facility"]');
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

  selectAssignedUser() {
    cy.clickAndSelectOption('[data-cy="select-assigned-user"]');
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
    this.selectFacility()
      .selectStatus(data.status)
      .selectCategory(data.category)
      .enterTitle(data.title)
      .enterReason(data.reason)
      .autoFillDetails();
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
    cy.typeIntoField('[data-cy="resource-search"]', title);
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
