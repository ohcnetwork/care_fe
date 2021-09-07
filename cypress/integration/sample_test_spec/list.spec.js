/// <reference types="cypress" />

describe("Sample List", () => {
  before(() => {
    cy.login("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.visit("http://localhost:4000");
    cy.get("a").contains("Sample Test").click();
  });

  it("Search by District name", () => {
    cy.get('[placeholder="District Name"]').type("TEst");
  });

  it("Search by Patient Name", () => {
    cy.get('[placeholder="Search by Patient Name"]').type("TEst");
  });

  it("Update Sample Status", () => {
    cy.contains("UPDATE SAMPLE TEST STATUS").click();
  });

  it("View Patient Details", () => {
    cy.contains("Patient Details").click();
  });

  it("View Sample Details", () => {
    cy.contains("Sample Details").click();
  });

  it("Next/Previous Page", () => {
    cy.wait(1000);
    cy.contains("Next").not(".hidden").click({ force: true });
    cy.wait(1000);
    cy.contains("Previous").not(".hidden").click({ force: true });
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
