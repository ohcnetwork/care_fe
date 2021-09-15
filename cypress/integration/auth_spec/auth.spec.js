/// <reference types="cypress" />

describe("Authorisation/Authentication", () => {
  beforeEach(() => {
    cy.visit("https://localhost:4000");
  });

  it("Try login as admin with correct password", () => {
    cy.login("devdistrictadmin", "Coronasafe@123");
  });

  it("Try login admin with incorrect password", () => {
    cy.login("devdistrictadmin", "Coronasafe123");
    cy.contains("No active account").should("exist");
  });

  afterEach(() => {
    cy.get("p").contains("Sign Out").click();
    cy.url().should("include", "login");
  });
});
