import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

describe("External Results Filters", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/external_results");
    cy.contains("Filters").click();
  });

  it("filter by lsg", () => {
    cy.get("[placeholder='Select Local Body']")
      .type("ernakulam")
      .type("{downarrow}{enter}");
    cy.contains("Apply").click();
    cy.contains("LSG:");
  });

  it("filter by ward", () => {
    cy.get("[placeholder='Select wards']")
      .type("ernakulam")
      .type("{downarrow}{enter}");
    cy.contains("Apply").click();
    cy.contains("Ward:");
  });

  it("filter by created date", () => {
    cy.get("[name='created_date_after']").type("2020-12-06");
    cy.get("[name='created_date_before']").type("2020-12-31");
    cy.contains("Apply").click();
    cy.contains("Created after: 2020-12-06");
    cy.contains("Created before: 2020-12-31");
  });

  it("filter by result date", () => {
    cy.get("[name='result_date_after']").type("2021-03-02");
    cy.get("[name='result_date_before']").type("2021-04-02");
    cy.contains("Apply").click();
    cy.contains("Result after: 2021-03-02");
    cy.contains("Result before: 2021-04-02");
  });

  it("filter by sample collection date", () => {
    cy.get("[name='sample_collection_date_after']").type("2021-01-04");
    cy.get("[name='sample_collection_date_before']").type("2021-03-03");
    cy.contains("Apply").click();
    cy.contains("Sample created after: 2021-01-04");
    cy.contains("Sample created before: 2021-03-03");
  });

  it("filter by srf id", () => {
    cy.get("[name='srf_id']").type("432");
    cy.contains("Apply").click();
    cy.contains("SRF ID: 432");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
