/// <reference types="cypress" />

import { cy, describe, before, beforeEach, it } from "local-cypress";

describe("Assets List", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/assets");
  });

  it("Search Asset Name", () => {
    cy.intercept(/\/api\/v1\/asset/).as("asset");
    const initialUrl =
      Cypress.config().baseUrl +
      "/assets?page=1&limit=18&search=dummy+camera+30";
    cy.get("[name='search']").type("dummy camera 30");
    cy.wait("@asset").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
      cy.url().then((currentUrl) => {
        expect(currentUrl).not.to.equal(initialUrl);
      });
    });
  });

  it("Scan Asset QR", () => {
    cy.contains("Scan Asset QR").click().wait(1000);
    cy.get("video").should("exist");
    cy.get("button").contains("Close Scanner").should("exist").click();
  });

  it("Next/Previous Page", () => {
    // only works for desktop mode
    cy.get("button")
      .should("contain", "Next")
      .contains("Next")
      .click({ force: true });
    cy.get("button")
      .should("contain", "Previous")
      .contains("Previous")
      .click({ force: true });
  });
});
