/// <reference types="cypress" />

import * as cy from "local-cypress";

cy.describe("Assets List", () => {
  cy.before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  cy.beforeEach(() => {
    cy.restoreLocalStorage();
    cy.visit("http://localhost:4000");
    cy.get("a").contains("Assets").click();
    cy.url().should("include", "/assets");
  });

  cy.it("Search Asset Name", () => {
    cy.get('[name="search"]').type("TEst");
  });

  cy.it("Scan Asset QR", () => {
    cy.contains("Scan Asset QR").click().wait(1000);
    cy.get("video").should("exist");
    cy.get("button").contains("Close Scanner").should("exist").click();
  });

  cy.it("Next/Previous Page", () => {
    cy.wait(1000);
    // only works for desktop mode
    cy.get("button").contains(">").click();
    cy.wait(1000);
    cy.get("button").contains("<").click();
  });
});
