/// <reference types="cypress" />

describe("Assets List", () => {
  before(() => {
    cy.login("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.visit("http://localhost:4000");
    cy.get("a").contains("Assets").click();
    cy.url().should("include", "/assets");
  });

  it("Search Asset Name", () => {
    cy.get('[name="search"]').type("TEst");
  });

  it("Scan Asset QR", () => {
    cy.contains("Scan Asset QR").click().wait(1000);
    cy.get("video").should("exist");
    cy.get("button").contains("Close Scanner").should("exist").click();
  });

  it("Next/Previous Page", () => {
    cy.wait(1000);
    // only works for desktop mode
    cy.get("button").contains("Next").click();
    cy.wait(1000);
    cy.get("button").contains("Prev").click();
  });
});
