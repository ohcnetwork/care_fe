export class LoginPage {
  private routes = {
    login: "/api/v1/auth/login/",
  };

  interceptLogin() {
    return cy.intercept("POST", this.routes.login).as("loginRequest");
  }

  // Add selectors for existing elements
  private readonly usernameInput = "[data-cy=username]";
  private readonly passwordInput = "[data-cy=password]";
  private readonly submitButton = "[data-cy=submit]";
  private readonly errorMessage = ".text-red-500";

  // Add new methods while keeping existing loginByRole
  typeUsername(username: string) {
    cy.get(this.usernameInput).type(username);
    return this;
  }

  typePassword(password: string) {
    cy.get(this.passwordInput).type(password);
    return this;
  }

  clickSubmit() {
    cy.get(this.submitButton).click();
    return this;
  }

  verifyFormElements() {
    cy.get(this.usernameInput).should("be.visible");
    cy.get(this.passwordInput).should("be.visible");
    cy.get(this.submitButton).should("be.visible");
    return this;
  }

  verifyValidationErrors() {
    cy.get(this.errorMessage).should("be.visible");
    return this;
  }

  loginByRole(role: string) {
    cy.visit("/login");
    cy.fixture("users").then((users) => {
      const user = users[role];
      cy.get(this.usernameInput).type(user.username);
      cy.get(this.passwordInput).type(user.password);
      cy.get(this.submitButton).click();
    });
  }
}
