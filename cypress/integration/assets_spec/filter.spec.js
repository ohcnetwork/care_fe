/// <reference types="cypress" />

describe("Assets Filter", () => {
  beforeEach(() => {
    cy.login("devdistrictadmin", "Coronasafe@123");
    cy.contains("Assets", "a").click();
    cy.contains("Advaned Filters").click();
  });

  it("Filter by Facility", () => {
    cy.get('[placeholder="Search by facility name or by district"]').click();
  });

  it("Filter by Asset Type", () => {
    cy.get('[name="asset_type"]').select("External");
  });

  it("Filter by Asset Status", () => {
    cy.get('[name="asset_status"]').select("Active");
  });

  afterEach(() => {
    cy.contains("Apply").click();
  });
});
