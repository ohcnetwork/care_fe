/// <reference types="cypress" />

describe("Authorisation/Authentication", () => {
  beforeEach(() => {
    cy.visit("http://localhost:4000");
  });

  it("Try login as admin with correct password", () => {
    cy.login("devdistrictadmin", "Coronasafe@123");
    cy.get("p").contains("Sign Out").click();
    cy.url().should("include", "login");
  });

  it("Try login admin with incorrect password", () => {
    cy.log(`Logging in the user: devdistrictadmin:Coronasafe@123`);

    cy.visit("http://localhost:4000/");
    cy.get('input[name="username"]').type("devdistrictadmin");
    cy.get('input[name="password"]').type("coronasafe@123");
    cy.get("button").contains("Login").click();
    cy.contains("No active account").should("exist");
  });
});
