import { cy, describe, beforeEach, it } from "local-cypress";

describe("Forgot Password", () => {
  beforeEach(() => {
    cy.awaitUrl("/", true);
    cy.get("button").contains("Forgot password?").click().wait(100);
  });

  it("Send Password Reset Link", () => {
    cy.get("input[id='forgot_username']").type("dummy_user_1");
    cy.contains("Send Reset Link").click().wait(1000);
    cy.contains("Password Reset Email Sent").should("exist");
  });

  it("Go to Login page", () => {
    cy.get("button").contains("Back to login").click();
    cy.url().should("contain", "/");
  });
});
