/// <reference types="cypress" />

describe("Sample Filter", () => {
  before(() => {
    cy.login("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.visit("http://localhost:4000");
    cy.get("a").contains("Sample Test").click();
    cy.contains("Advanced Filters").click();
    cy.wait(2000);
  });

  it("Filter by Status", () => {
    cy.get('[name="status"]').select("APPROVED");
  });

  it("Filter by Asset Type", () => {
    cy.get('[name="result"]').select("POSITIVE");
  });

  afterEach(() => {
    cy.contains("Apply").click();
    cy.wait(1000);
    cy.saveLocalStorage();
  });
});
