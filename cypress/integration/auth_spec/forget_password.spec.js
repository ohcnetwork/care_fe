/// <reference types="cypress" />

describe("Forgot Password", () => {
  beforeEach(() => {
    cy.visit("http://localhost:4000");
    cy.get("a").contains("Forgot password?").click().wait(100);
  });

  it("Send Password Reset Link", () => {
    cy.get('[name="username"]').type("dummy_user_1");
    cy.contains("Send Reset Link").click().wait(1000);
  });

  it("Go to Login page", () => {
    cy.get("a").contains("Login").click();
    cy.url().should("contain", "/login");
  });
});
