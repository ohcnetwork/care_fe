import { LoginPage } from "../../pageObject/auth/LoginPage";

describe("Login Page", () => {
  const loginPage = new LoginPage();

  beforeEach(() => {
    cy.visit("/login");
  });

  it("should validate login form elements and display validation errors", () => {
    loginPage.verifyFormElements().clickSubmit().verifyValidationErrors();
  });
});
