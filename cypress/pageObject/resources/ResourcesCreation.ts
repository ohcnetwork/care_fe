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
    cy.typeIntoField('[data-cy="title-input"]', title);
    return this;
  }

  enterReasonOfRequest(reason: string) {
    cy.typeIntoField('[data-cy="reason-input"]', reason);
    return this;
  }

  clickFillMyDetails() {
    cy.verifyAndClickElement(
      '[data-cy="fill_my_details_button"]',
      "Fill My Details",
    );
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

  verifyResourceCreationApiCall() {
    cy.wait("@createResource").then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });
    return this;
  }
  assertResourceCreateSuccess() {
    cy.verifyNotification("Request created successfully");
    return this;
  }
}
