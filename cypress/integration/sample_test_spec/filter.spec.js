/// <reference types="cypress" />

describe("Sample Filter", () => {
  beforeEach(() => {
    cy.login("devdistrictadmin", "Coronasafe@123");
    cy.contains("Sample Test", "a").click();
    cy.contains("Advaned Filters").click();
  });

  it("Filter by Status", () => {
    cy.get('[name="status"]').select("APPROVED");
  });

  it("Filter by Asset Type", () => {
    cy.get('[name="result"]').select("POSITIVE");
  });

  afterEach(() => {
    cy.contains("Apply").click();
  });
});
