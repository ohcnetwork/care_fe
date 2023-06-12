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
    cy.get("#status").click();
    cy.get("li[role='option']")
      .contains(/^APPROVED$/)
      .click();
  });

  it("Filter by Asset Type", () => {
    cy.get("#result").click();
    cy.get("li[role='option']")
      .contains(/^POSITIVE$/)
      .click();
  });

  it("Filter by sample type", () => {
    cy.get("#sample_type").click();
    cy.get("li[role='option']")
      .contains(/^Biopsy$/)
      .click();
  });

  afterEach(() => {
    cy.intercept(/\/api\/v1\/test_sample/).as("sample_filter");
    cy.contains("Apply").click();
    cy.wait("@sample_filter");
    cy.saveLocalStorage();
  });
});
