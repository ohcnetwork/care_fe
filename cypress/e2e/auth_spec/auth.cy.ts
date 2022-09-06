/// <reference types="cypress" />

import { cy, describe, beforeEach, it } from "local-cypress";

describe("Authorisation/Authentication", () => {
  beforeEach(() => {
    cy.visitWait("/", true);
  });

  it("Try login as admin with correct password", () => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.visitWait("/facility");
    cy.get("p").contains("Sign Out").click();
    cy.url().should("include", "/");
  });

  it("Try login admin with incorrect password", () => {
    cy.log("Logging in the user: devdistrictadmin:Coronasafe@123");

    cy.visitWait("/", true);
    cy.get("input[name='username']").type("devdistrictadmin");
    cy.get("input[name='password']").type("coronasafe@123");
    cy.get("button").contains("Login").click();
    cy.contains("No active account").should("exist");
  });
});
