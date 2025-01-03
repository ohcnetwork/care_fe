import { LoginPage } from "../../pageObject/auth/LoginPage";

describe("Login Page", () => {
  const loginPage = new LoginPage();

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.saveLocalStorage();
    cy.visit("/login");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });

  it("should successfully login with admin credentials", () => {
    loginPage.interceptLogin();
    loginPage.loginByRole("admin");
    loginPage.verifyLoginResponse();
    cy.url().should("include", "/");
  });

  it("should display login form elements", () => {
    loginPage.verifyFormElements();
  });

  it("should show validation errors for empty fields", () => {
    loginPage.clickSubmit().verifyValidationErrors();
  });
});
