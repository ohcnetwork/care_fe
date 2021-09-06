/// <reference types="cypress" />

describe("Assets List", () => {
  beforeEach(() => {
    cy.login("devdistrictadmin", "Coronasafe@123");
    cy.contains("Assets", "a").click();
  });

  it("Search Asset Name", () => {
    cy.get('[name="search"]').type("TEst");
  });

  it("Scan Asset QR", () => {
    cy.contains("Scan Asset QR").click();
    cy.get("video").exists();
    cy.contains("Close Scanner", "button").exists().click();
  });

  it("Next/Previous Page", () => {
    cy.contains("Next").click();
    cy.url().should("contain", "limit=2");
  });
});
