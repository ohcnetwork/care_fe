import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

describe("Sample Filter", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/sample");
    cy.contains("Advanced Filters").click();
  });

  it("Filter by Status", () => {
    cy.get("[name='status']").select("APPROVED");
  });

  it("Filter by Asset Type", () => {
    cy.get("[name='result']").select("POSITIVE");
  });

  it("Filter by sample type", () => {
    cy.get("[name='sample_type']").select("Biopsy");
  });

  afterEach(() => {
    cy.intercept(/\/api\/v1\/test_sample/).as("sample_filter");
    cy.contains("Apply").click();
    cy.wait("@sample_filter");
    cy.saveLocalStorage();
  });
});
