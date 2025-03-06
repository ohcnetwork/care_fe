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

  verifyNameFilled(name: string) {
    cy.get('[data-cy="contact_person"]').should("contain", name);
    return this;
  }
  verifyPhoneNumber(number: string) {
    cy.get('[data-cy="contact_person_phone"]').should("contain", number);
  }

  clickSubmitButton() {
    cy.clickSubmitButton("Submit");
    return this;
  }
  assertResourceCreateSuccess() {
    cy.verifyNotification("Request created successfully");
    return this;
  }
}
