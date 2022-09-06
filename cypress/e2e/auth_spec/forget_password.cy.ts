import { cy, describe, beforeEach, it } from "local-cypress";

describe("Forgot Password", () => {
  beforeEach(() => {
    cy.intercept(/fontawesome/).as("fontawesome");
    cy.intercept(/currentuser/).as("currentuser");
    cy.visit("http://localhost:4000");
    cy.wait("@fontawesome");
    cy.wait("@currentuser");
    cy.get("a").contains("Forgot password?").click().wait(100);
  });

  it("Send Password Reset Link", () => {
    cy.get("[name='username']").type("dummy_user_1");
    cy.contains("Send Reset Link").click().wait(1000);
    cy.contains("Password Reset Email Sent").should("exist");
  });

  it("Go to Login page", () => {
    cy.get("a").contains("Login").click();
    cy.url().should("contain", "/login");
  });
});
