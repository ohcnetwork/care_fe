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
    cy.get('[placeholder="District Name"]').type("TEst").wait(1000);
    cy.url().should("include", "TEst");
  });

  it("Search by Patient Name", () => {
    cy.get('[placeholder="Search by Patient Name"]').type("Test").wait(1000);
    cy.url().should("include", "Test");
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
    // only works for desktop mode
    cy.get("button").contains("Next").click();
    cy.wait(1000);
    cy.get("button").contains("Prev").click();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
