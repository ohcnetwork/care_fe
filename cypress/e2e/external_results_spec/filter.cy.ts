import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

describe("External Results Filters", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.intercept(/fontawesome/).as("fontawesome");
    cy.intercept(/currentuser/).as("currentuser");
    cy.visit("http://localhost:4000/external_results");
    cy.wait("@fontawesome");
    cy.wait("@currentuser");
    cy.contains("Filters").click();
  });

  it("filter by lsg", () => {
    cy.get("[placeholder='Select Local Body']")
      .type("ernakulam")
      .type("{downarrow}{enter}");
  });

  it("filter by ward", () => {
    cy.get("[placeholder='Select wards']")
      .type("ernakulam")
      .type("{downarrow}{enter}");
  });

  it("filter by created date", () => {
    cy.get("[name='created_date_after']").type("06/12/2020");
    cy.get("[name='created_date_before']").type("31/12/2020");
  });

  it("filter by result date", () => {
    cy.get("[name='result_date_after']").type("02/03/2021");
    cy.get("[name='result_date_before']").type("02/04/2021");
  });

  it("filter by sample collection date", () => {
    cy.get("[name='sample_collection_date_after']").type("04/01/2021");
    cy.get("[name='sample_collection_date_before']").type("03/03/2021");
  });

  it("filter by srf id", () => {
    cy.get("[name='srf_id']").type("432");
    cy.contains("Apply").click();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
