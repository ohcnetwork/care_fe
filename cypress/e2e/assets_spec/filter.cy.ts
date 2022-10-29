/// <reference types="cypress" />

import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

describe("Assets Filter", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/assets");
    cy.contains("Advanced Filters").click();
  });

  it("Filter by Facility", () => {
    cy.get("[name=Facility]")
      .type("test")
      .wait(3000)
      .type("{downarrow}{enter}");
  });

  it("Filter by Asset Type", () => {
    cy.get("[name='asset_type']").select("EXTERNAL");
  });

  it("Filter by Asset Status", () => {
    cy.get("[name='asset_status']").select("ACTIVE");
  });

  afterEach(() => {
    cy.contains("Apply").click();
  });
});
