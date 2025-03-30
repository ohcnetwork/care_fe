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
  enterResourceTitle(title: string) {
    cy.typeIntoField('[data-cy="title-input"]', title, {
      clearBeforeTyping: true,
    });
    return this;
  }

  enterReasonOfRequest(reason: string) {
    cy.typeIntoField('[data-cy="reason-input"]', reason, {
      clearBeforeTyping: true,
    });
    return this;
  }
  clickFillMyDetails() {
    cy.verifyAndClickElement(
      '[data-cy="fill_my_details_button"]',
      "Fill My Details",
    );
    return this;
  }

  fillResourceRequestDetails(data: ResourceRequestFormData) {
    this.selectFacility(data.facility)
      .selectStatus(data.status)
      .selectCategory(data.category)
      .enterResourceTitle(data.title)
      .enterReasonOfRequest(data.reason)
      .clickFillMyDetails();
    return this;
  }

  clickSubmitButton() {
    cy.clickSubmitButton("Submit");
    return this;
  }

  interceptResourceCreationRequest() {
    cy.intercept("POST", "**/api/v1/resource/").as("createResource");
    return this;
  }
  interceptResourceUpdateRequest() {
    cy.intercept("PUT", "**/api/v1/resource/**").as("updatedResource");
    return this;
  }

  verifyResourceCreationApiCall() {
    cy.wait("@createResource").then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });
    return this;
  }
  verifyResourceUpdationApiCall() {
    cy.wait("@updatedResource").then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });
    return this;
  }
  assertResourceCreateSuccess() {
    cy.verifyNotification("Request created successfully");
    return this;
  }
  assertResourceUpdateSuccess() {
    cy.verifyNotification("Resource updated successfully");
    return this;
  }
  searchResource(name: string) {
    cy.get('[data-cy="search-resource"]').click();
    cy.typeIntoField("#resource-search", name);
    cy.get('[data-cy="search-resource"]').click();
    return this;
  }

  verifyResourceRequestInPatientPage(data: ResourceRequestFormData) {
    cy.verifyContentPresence("[data-cy='resource-requests-table']", [
      data.category,
      data.title,
      data.status,
    ]);
    return this;
  }

  verifyResourceCardContent(data: ResourceRequestFormData) {
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
  clickSidebarResource() {
    cy.verifyAndClickElement('[data-sidebar="content"]', "Resource");
    return this;
  }

  clickUpdateStatusButton() {
    cy.verifyAndClickElement(
      '[data-cy="update-status-button"]',
      "Update Status",
    );
    return this;
  }
  clickViewDetailsButton() {
    cy.verifyAndClickElement(
      '[data-cy="resource-view-details-0"]',
      "View Details",
    );
    return this;
  }

  clickFilterTab(name: string) {
    cy.get(`[data-cy='tab-${name}']`).click();
    return this;
  }
}
