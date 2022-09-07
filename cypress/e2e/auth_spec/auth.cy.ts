/// <reference types="cypress" />

import { cy, describe, beforeEach, it } from "local-cypress";

describe("Authorisation/Authentication", () => {
  beforeEach(() => {
    cy.intercept(/fontawesome/).as("fontawesome");
    cy.intercept(/currentuser/).as("currentuser");
    cy.visit("http://localhost:4000");
    cy.wait("@fontawesome");
    cy.wait("@currentuser");
  });

  it("Try login as admin with correct password", () => {
    cy.login("devdistrictadmin", "Coronasafe@123");
    cy.get("p").contains("Sign Out").click();
    cy.wait(1000);
    cy.url().should("include", "/");
  });

  it("Try login admin with incorrect password", () => {
    cy.log("Logging in the user: devdistrictadmin:Coronasafe@123");

    cy.visit("http://localhost:4000/");
    cy.get("input[name='username']").type("devdistrictadmin");
    cy.get("input[name='password']").type("coronasafe@123");
    cy.get("button").contains("Login").click();
    cy.contains("No active account").should("exist");
  });
});
