/// <reference types="cypress" />

describe("Forgot Password", () => {
  beforeEach(() => {
    cy.visit("http://localhost:4000");
    cy.get('[href="/forgot_password"] a').click();
  });

  it("Send Password Reset Link", () => {
    cy.get('[name="username"]').type("dummy_user_1");
    cy.contains("Send Reset Link").click();
  });

  it("Go to Login page", () => {
    cy.get('[href="/login"] a').click();
    cy.url().should("contain", "/login");
  });
});
