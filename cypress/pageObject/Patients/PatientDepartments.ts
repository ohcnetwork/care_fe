export class PatientDepartments {
  navigateToSettings() {
    cy.verifyAndClickElement('[data-sidebar="content"]', "Settings");
    return this;
  }
  navigateToDevicesTab() {
    cy.verifyAndClickElement(
      '[data-cy="settings-departments-tab"]',
      "Departments",
    );
    return this;
  }

  clickAddDepartment() {
    cy.verifyAndClickElement(
      '[data-cy="add-department/team-button"]',
      "Add Department/Team",
    );
    return this;
  }

  enterName(name: string) {
    cy.typeIntoField('[data-cy="department-team-name-input"]', name, {
      clearBeforeTyping: true,
    });
    return this;
  }
  selectType(type: string) {
    cy.clickAndSelectOption('[data-cy="select-type-dropdown"]', type);
    return this;
  }

  enterDescription(description: string) {
    cy.typeIntoField(
      '[data-cy="department-team-description-input"]',
      description,
      {
        clearBeforeTyping: true,
      },
    );
    return this;
  }

  interceptCreateRequest() {
    cy.intercept("POST", "**/api/v1/facility/**").as("createOrganization");
    return this;
  }

  verifyCreateRequest() {
    cy.wait("@createOrganization").then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });
    return this;
  }

  clickCreateOrganization() {
    cy.verifyAndClickElement(
      '[data-cy="create-organization-button"]',
      "Create Organization",
    );
    return this;
  }

  assertCreationSuccess() {
    cy.verifyNotification("Organization created successfully");
    return this;
  }

  searchDepartment(departmentName: string) {
    cy.typeIntoField('[data-cy="search-department-team"]', departmentName, {
      clearBeforeTyping: true,
    });
    return this;
  }

  verifyDepartmentInList(departmentName: string) {
    cy.verifyContentPresence('[data-cy="department-team-list"]', [
      departmentName,
    ]);
    return this;
  }

  openDepartmentsDetails() {
    cy.get('[data-cy="department-team-list"]')
      .first()
      .contains("See Details")
      .click();
    return this;
  }

  clickViewDepartmentTeam() {
    cy.verifyAndClickElement('[data-cy="view-department-team"]', "See Details");
    return this;
  }

  clickUsersTab() {
    cy.verifyAndClickElement('[data-cy="users-tab"]', "Users");
    return this;
  }

  clickLinkUser() {
    cy.verifyAndClickElement('[data-cy="link-user"]', "Link User");
    return this;
  }

  selectAssignedUser(user: string) {
    cy.typeAndSelectOption('[data-cy="select-assigned-user"]', user, false);
    return this;
  }

  selectRoleOfUser(role: string) {
    cy.clickAndSelectOption('[data-cy="select-role-dropdown"]', role);
    return this;
  }

  clickAddUserToOrganization() {
    cy.verifyAndClickElement(
      '[data-cy="add-user-to-organization"]',
      "Add to Organization",
    );
    return this;
  }
  assertUserAddedSuccess() {
    cy.verifyNotification("User added to organization successfully");
    return this;
  }

  searchUser(userName: string) {
    cy.typeIntoField('[data-cy="search-by-username"]', userName, {
      clearBeforeTyping: true,
    });
    return this;
  }

  verifyUserInList(userName: string) {
    cy.verifyContentPresence('[data-cy="user-list-0"]', [userName]);
    return this;
  }
  clickEditRole() {
    cy.verifyAndClickElement('[data-cy="edit-user-role"]', "Edit Role");
    return this;
  }

  clickRemoveUser() {
    cy.verifyAndClickElement('[data-cy="remove-user"]', "Remove User");
    return this;
  }
  clickConfirmRemove() {
    cy.verifyAndClickElement('[data-cy="confirm-remove-user"]', "Remove");
    return this;
  }

  assertUserRemovalSuccess() {
    cy.verifyNotification("User removed from organization successfully");
    return this;
  }
}
