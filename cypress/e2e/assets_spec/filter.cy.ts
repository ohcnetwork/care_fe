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
    cy.get("[name=Facilities]").type("test");
    cy.intercept(/\/api\/v1\/getallfacilities/).as("facilities");
    cy.wait("@facilities").then((interception) => {
      console.log("url", interception.response.url);
      expect(interception.response.statusCode).to.equal(200);
      expect(interception.request.url).to.include("search_text=test");
    });
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
