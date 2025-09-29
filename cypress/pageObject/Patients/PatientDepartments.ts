export class PatientDepartments {
  navigateToSettings() {
    cy.verifyAndClickElement('[data-cy="nav-settings"]', "Settings");
    return this;
  }
  navigateToDepartments() {
    cy.verifyAndClickElement('[data-cy="nav-departments"]', "Departments");
    return this;
  }

  clickAddDepartmentTeam() {
    cy.verifyAndClickElement(
      '[data-cy="add-department/team-button"]',
      "Add Department/Team",
    );
    return this;
  }

  clickEditOrganization() {
    cy.verifyAndClickElement('[data-cy="edit-department-team"]', "Edit");
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

  interceptAssignUserRequest() {
    cy.intercept("POST", "**/api/v1/facility/**").as("assignUser");
    return this;
  }

  verifyAssignUserRequest() {
    cy.wait("@assignUser").then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });
    return this;
  }

  interceptUpdateRoleRequest() {
    cy.intercept("PUT", "**/api/v1/facility/**").as("updateUserRole");
    return this;
  }

  verifyUpdateRoleRequest() {
    cy.wait("@updateUserRole").then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });
    return this;
  }

  interceptRemoveUserRequest() {
    cy.intercept("DELETE", "**/api/v1/facility/**").as("removeUser");
    return this;
  }

  verifyRemoveUserRequest() {
    cy.wait("@removeUser").then((interception) => {
      expect(interception.response?.statusCode).to.equal(204);
    });
    return this;
  }
  interceptUpdateRequest() {
    cy.intercept("PUT", "**/api/v1/facility/**").as("updateOrganization");
    return this;
  }

  verifyCreateRequest() {
    cy.wait("@createOrganization").then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });
    return this;
  }
  verifyUpdateRequest() {
    cy.wait("@updateOrganization").then((interception) => {
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
  clickUpdateOrganization() {
    cy.verifyAndClickElement(
      '[data-cy="update-organization-button"]',
      "Update Organization",
    );
    return this;
  }

  assertCreationSuccess() {
    cy.verifyNotification("Organization created successfully");
    return this;
  }
  assertUpdateSuccess() {
    cy.verifyNotification("Organization updated successfully");
    return this;
  }

  verifyParentDepartmentAndClick(departmentName: string) {
    cy.get('[data-cy="organization-tree-node-parent"]')
      .contains(departmentName)
      .scrollIntoView()
      .click();
    return this;
  }

  searchDepartmentTeam(departmentName: string) {
    cy.typeIntoField('[data-cy="search-department-team"]', departmentName, {
      clearBeforeTyping: true,
    });
    return this;
  }

  verifyDepartmentTeamContentInList(
    OrganizationName: string,
    OrganizationType: string,
  ) {
    cy.verifyContentPresence('[data-cy="department-team-list"]', [
      OrganizationName,
      OrganizationType,
    ]);
    return this;
  }

  openDepartmentsTeamFirstRandomDetails() {
    cy.get('[data-cy="department-team-list"]').first().click();
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
    cy.typeAndSelectOption('button:contains("Select Role")', role, false);
    return this;
  }

  selectRoleOfUserInEdit(role: string) {
    cy.typeAndSelectOption('button:contains("Select Role")', role, false);
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

  verifyUserRole(role: string) {
    cy.verifyContentPresence('[data-cy="user-role"]', [role]);
    return this;
  }

  clickEditRole() {
    cy.verifyAndClickElement('[data-cy="edit-user-role"]', "Edit Role");
    return this;
  }

  clickUpdateUserRole() {
    cy.verifyAndClickElement('[data-cy="update-user-role"]', "Update Role");
    return this;
  }

  clickRemoveUser() {
    cy.verifyAndClickElement('[data-cy="remove-user"]', "Remove User");
    return this;
  }
  clickConfirmRemove() {
    cy.clickConfirmAction("Remove");
    return this;
  }

  assertUserRemovalSuccess() {
    cy.verifyNotification("User removed from organization successfully");
    return this;
  }

  selectAllOrganizationsTab() {
    cy.verifyAndClickElement(
      `[data-cy="all-organizations-tab"]`,
      "All Organizations",
    );
    return this;
  }

  selectOrganization(organizationName: string) {
    cy.clickAndSelectOption(
      '[data-cy="facility-organization"]',
      organizationName,
    );
    return this;
  }

  deleteExistingOrganization() {
    cy.verifyAndClickElement(
      '[data-cy="delete-organization"]',
      "Delete Organization",
    );
  }

  clickAddOrganizationToEncounterSubmit() {
    cy.verifyAndClickElement(
      '[data-cy="add-organization"]',
      "Add Organizations",
    );
    return this;
  }

  clickAddOrganization() {
    cy.get("button[data-slot='tabs-trigger']")
      .filter(":visible")
      .contains("Actions")
      .click();
    cy.get("button").contains("Update Department").click();
    return this;
  }

  interceptDeleteOrganization() {
    cy.intercept("DELETE", "**/api/v1/encounter/*/organizations_remove/**").as(
      "deleteOrganization",
    );
    return this;
  }

  deleteOrganization() {
    cy.get('[data-cy="delete-organization-button"]').first().click();
    return this;
  }

  verifyDeleteOrganizationSuccess() {
    cy.wait("@deleteOrganization").its("response.statusCode").should("eq", 200);
    return this;
  }

  verifyOrganizationAdded() {
    cy.verifyNotification("Organization added successfully");
    return this;
  }
}
