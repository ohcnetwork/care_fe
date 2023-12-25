/// <reference types="cypress" />

import { cy, describe, it } from "local-cypress";

describe("redirect", () => {
  it("Check if login redirects to the right url", () => {
    cy.log("Logging in the user staffdev:Coronasafe@123");

    cy.visit("/resource/board");
    cy.get("input[id='username']").type("staffdev");
    cy.get("input[id='password']").type("Coronasafe@123");
    cy.get("button").contains("Login").click();

    cy.get("p").contains("Sign Out").should("exist");
    cy.url().should("include", "/resource/board");
  });
});
