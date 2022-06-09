/// <reference types="cypress" />

describe("Assets Filter", () => {
  before(() => {
    cy.login("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.visit("http://localhost:4000");
    cy.get("a").contains("Assets").click();
    cy.contains("Advanced Filters").click();
    cy.wait(2000);
  });

  it("Filter by Facility", () => {
    cy.get('[placeholder="Search by facility name or by district"]')
      .type("test")
      .wait(3000)
      .type("{downarrow}{enter}");
  });

  it("Filter by Asset Type", () => {
    cy.get('[name="asset_type"]').select("EXTERNAL");
  });

  it("Filter by Asset Status", () => {
    cy.get('[name="asset_status"]').select("ACTIVE");
  });

  afterEach(() => {
    cy.contains("Apply").click();
  });
});
