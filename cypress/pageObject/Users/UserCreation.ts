export interface UserData {
  firstName?: string;
  lastName?: string;
  username?: string;
  password?: string;
  email?: string;
  phoneNumber?: string;
  userType?: string;
  state?: string;
  district?: string;
  localBody?: string;
  ward?: string;
  gender?: string;
}

export class UserCreation {
  clickAddUserButton() {
    cy.verifyAndClickElement('[data-cy="add-user-button"]', "Add User");
    return this;
  }

  navigateToUsersTab() {
    cy.verifyAndClickElement('[data-cy="org-nav-users"]', "Users");
    return this;
  }

  fillFirstName(firstName: string) {
    cy.typeIntoField('[data-cy="first-name-input"]', firstName);
    return this;
  }

  fillLastName(lastName: string) {
    cy.typeIntoField('[data-cy="last-name-input"]', lastName);
    return this;
  }

  fillUsername(username: string) {
    cy.typeIntoField('[data-cy="username-input"]', username);
    return this;
  }

  fillPassword(password: string) {
    cy.typeIntoField('[data-cy="password-input"]', password);
    return this;
  }

  fillConfirmPassword(confirmPassword: string) {
    cy.typeIntoField('[data-cy="confirm-password-input"]', confirmPassword);
    return this;
  }

  fillEmail(email: string) {
    cy.typeIntoField('[data-cy="email-input"]', email, {
      clearBeforeTyping: true,
    });
    return this;
  }

  fillPhoneNumber(phoneNumber: string) {
    cy.typeIntoField('[data-cy="phone-number-input"]', phoneNumber, {
      skipVerification: true,
    });
    return this;
  }

  verifyValidationErrors() {
    cy.verifyErrorMessages([
      { label: "First Name", message: "This field is required" },
      { label: "Last Name", message: "This field is required" },
      { label: "Username", message: "This field is required" },
      { label: "Password", message: "This field is required" },
      {
        label: "Phone Number",
        message: "This field is required",
      },
      {
        label: "Gender",
        message: "Gender is required",
      },
    ]);
    return this;
  }

  selectUserType(userType: string) {
    cy.clickAndSelectOption('[data-cy="user-type-select"]', userType);
    return this;
  }

  selectState(state: string) {
    cy.clickAndSelectOption('[data-cy="select-state"]', state);
    return this;
  }

  selectDistrict(district: string) {
    cy.clickAndSelectOption('[data-cy="select-district"]', district);
    return this;
  }

  selectLocalBody(localBody: string) {
    cy.typeAndSelectOption('[data-cy="select-local_body"]', localBody, false);
    return this;
  }

  selectWard(ward: string) {
    cy.clickAndSelectOption('[data-cy="select-ward"]', ward);
    return this;
  }

  selectGender(gender: string) {
    cy.clickAndSelectOption('[data-cy="gender-select"]', gender);
    return this;
  }

  fillUserDetails(userData: UserData & { confirmPassword?: string }) {
    if (userData.userType) this.selectUserType(userData.userType);
    if (userData.firstName) this.fillFirstName(userData.firstName);
    if (userData.lastName) this.fillLastName(userData.lastName);
    if (userData.username) this.fillUsername(userData.username);
    if (userData.password) {
      this.fillPassword(userData.password);
      this.fillConfirmPassword(userData.confirmPassword || userData.password);
    }
    if (userData.email) this.fillEmail(userData.email);
    if (userData.phoneNumber) this.fillPhoneNumber(userData.phoneNumber);
    if (userData.gender) this.selectGender(userData.gender);
    if (userData.state) this.selectState(userData.state);
    if (userData.district) this.selectDistrict(userData.district);
    if (userData.localBody) this.selectLocalBody(userData.localBody);
    if (userData.ward) this.selectWard(userData.ward);
    return this;
  }

  submitUserForm() {
    cy.clickSubmitButton("Create User");
    return this;
  }

  selectUserRole(role: string) {
    cy.typeAndSelectOption('button:contains("Select Role")', role, false);
    return this;
  }

  clickLinkToOrganization() {
    cy.verifyAndClickElement(
      '[data-cy="link-user-button"]',
      "Link to Organization",
    );
    return this;
  }

  interceptUserCreationRequest() {
    cy.intercept("POST", "**/api/v1/users/").as("createUser");
    return this;
  }

  verifyUserCreationApiCall() {
    cy.wait("@createUser").then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });
    return this;
  }

  interceptOrganizationUserLinking() {
    cy.intercept("POST", "**/api/v1/organization/*/users/").as("linkUserToOrg");
    return this;
  }

  verifyOrganizationUserLinkingApiCall() {
    cy.wait("@linkUserToOrg").then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });
    return this;
  }
}
