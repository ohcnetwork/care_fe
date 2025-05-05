export class PatientDetails {
  clickUsersTab() {
    cy.verifyAndClickElement('[data-cy="tab-users"]', "Users");
    return this;
  }

  clickAssignUserButton() {
    cy.intercept("GET", "**/api/v1/users/**").as("getUsers");
    cy.verifyAndClickElement('[data-cy="assign-user-button"]', "Assign User");
    cy.wait("@getUsers").its("response.statusCode").should("eq", 200);
    return this;
  }

  selectUserToAssign(username: string) {
    cy.typeAndSelectOption(
      '[data-cy="patient-user-selector-container"]',
      username,
      false,
    );
    return this;
  }

  selectUserRole(role: string) {
    cy.clickAndSelectOption('[data-cy="patient-user-role-select"]', role);
    return this;
  }

  confirmUserAssignment() {
    cy.verifyAndClickElement(
      '[data-cy="patient-user-assign-button"]',
      "Assign to Patient",
    );
    return this;
  }

  verifyUserAssignmentSuccess() {
    cy.verifyNotification("User added to patient successfully");
    return this;
  }

  clickRemoveUserButton() {
    cy.get('[data-cy="patient-user-remove-button"]').first().click();
    return this;
  }

  confirmUserRemoval() {
    cy.verifyAndClickElement(
      '[data-cy="patient-user-remove-confirm-button"]',
      "Remove",
    );
    return this;
  }

  verifyUserContent(expectedTexts: string[]) {
    cy.verifyContentPresence('[data-cy="patient-users"]', expectedTexts);
    return this;
  }

  verifyUserRemovalSuccess() {
    cy.verifyNotification("User removed successfully");
    return this;
  }

  clickResourcesTab() {
    cy.verifyAndClickElement('[data-cy="tab-resource_requests"]', "Requests");
    return this;
  }

  clickCreateRequestButton() {
    cy.verifyAndClickElement(
      '[data-cy="create-request-button"]',
      "Create Request",
    );
  }
  saveCurrentUrl() {
    cy.saveCurrentUrl();
    return this;
  }

  navigateToSavedUrl() {
    cy.navigateToSavedUrl();
    return this;
  }
}
