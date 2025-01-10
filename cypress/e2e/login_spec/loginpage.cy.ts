import { LoginPage } from "../../pageObject/auth/LoginPage";

describe("Login Page", () => {
  const loginPage = new LoginPage();

  beforeEach(() => {
    cy.visit("/login");
  });

  it("should successfully login with admin credentials", () => {
    cy.loginByApi("staff");
    cy.url().should("include", "/");
  });

  it("should display login form elements", () => {
    loginPage.verifyFormElements();
  });

  it("should show validation errors for empty fields", () => {
    loginPage.clickSubmit().verifyValidationErrors();
  });
});
