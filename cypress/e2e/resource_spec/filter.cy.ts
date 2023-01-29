import { cy, describe, it, before, beforeEach, afterEach } from "local-cypress";

describe("Resource filter", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/resource");
    cy.contains("Filters").click();
  });

  it("filter by origin facility", () => {
    cy.intercept(/\/api\/v1\/getallfacilities/).as("facilities_filter");
    cy.get("[name='orgin_facility']").type("harsha").wait("@facilities_filter");
    cy.get("[name='orgin_facility']").type("{downarrow}{enter}");
    cy.contains("Apply").click();
  });

  it("filter by resource approval facility", () => {
    cy.intercept(/\/api\/v1\/getallfacilities/).as("facilities_filter");
    cy.get("[name='approving_facility']")
      .type("test")
      .wait("@facilities_filter");
    cy.get("[name='approving_facility']").type("{downarrow}{enter}");
    cy.contains("Apply").click();
  });

  it("filter by assigned facility", () => {
    cy.intercept(/\/api\/v1\/getallfacilities/).as("facilities_filter");
    cy.get("[name='assigned_facility']").type("center");
    cy.wait("@facilities_filter");
    cy.get("[name='assigned_facility']").type("{downarrow}{enter}");
    cy.contains("Apply").click();
  });

  it("filter by ordering", () => {
    [
      "DESC Created Date",
      "ASC Modified Date",
      "DESC Modified Date",
      "ASC Created Date",
    ].forEach((select) => {
      cy.get("[name='ordering']").select(select);
      cy.intercept(/\/api\/v1\/resource/).as("resource_filter");
      cy.contains("Apply").click().wait("@resource_filter");
      cy.contains("Filters").click();
    });
    cy.contains("Cancel").click();
  });

  it("filter by emergency case", () => {
    ["yes", "no"].forEach((select) => {
      cy.get("[name='emergency']").select(select);
      cy.intercept(/\/api\/v1\/resource/).as("resource_filter");
      cy.contains("Apply").click().wait("@resource_filter");
      cy.contains("Filters").click();
    });
    cy.contains("Cancel").click();
  });

  it("filter by created date", () => {
    cy.intercept(/\/api\/v1\/resource/).as("resource_filter");
    cy.get("[name='created_date_after']").type("22/05/2020");
    cy.get("[name='created_date_before']").type("09/09/2021");
    cy.contains("Apply").click();
    cy.wait("@resource_filter");
  });

  it("filter by modified date", () => {
    cy.intercept(/\/api\/v1\/resource/).as("resource_filter");
    cy.get("[name='modified_date_after']").type("22/05/2020");
    cy.get("[name='modified_date_before']").type("09/09/2021");
    cy.contains("Apply").click();
    cy.wait("@resource_filter");
  });

  afterEach(() => {
    cy.contains("Filters").click({ force: true });
    cy.contains("Clear Filters").click();
    cy.saveLocalStorage();
  });
});
