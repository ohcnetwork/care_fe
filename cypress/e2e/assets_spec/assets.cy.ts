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
    cy.get("[name='search']").type("TEst");
    cy.wait("@asset").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
      expect(interception.request.url).to.include("search_text=TEst");
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
