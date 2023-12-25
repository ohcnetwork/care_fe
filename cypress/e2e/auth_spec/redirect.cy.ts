/// <reference types="cypress" />

import { cy, describe, it } from "local-cypress";

describe("redirect", () => {
  it("Check if login redirects to the right url", () => {
    cy.log("Logging in the user staffdev:Coronasafe@123");

    cy.visit(
      "/facility/657c32be-d584-476c-9ce2-0412f0e7692e/cns?page=1&limit=6"
    );
    cy.get("input[id='username']").type("staffdev");
    cy.get("input[id='password']").type("Coronasafe@123");
    cy.get("button").contains("Login").click();

    cy.get("p").contains("Sign Out").should("exist");
    cy.url().should(
      "include",
      "/facility/657c32be-d584-476c-9ce2-0412f0e7692e/cns?page=1&limit=6"
    );
  });
});
