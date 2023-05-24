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
    cy.contains("Apply").click();
    cy.contains("Facility:");
  });

  it("Filter by Asset Type", () => {
    cy.get("[id='asset-type'] > div > button")
      .click()
      .get("li")
      .contains("EXTERNAL")
      .click();
    cy.contains("Apply").click();
    cy.contains("Asset Type: EXTERNAL");
  });

  it("Filter by Asset Status", () => {
    cy.get("[id='asset-status'] > div > button")
      .click()
      .get("li")
      .contains("ACTIVE")
      .click();
    cy.contains("Apply").click();
    cy.contains("Status: ACTIVE");
  });

  it("Filter by Asset Class", () => {
    cy.get("[id='asset-class'] > div > button")
      .click()
      .get("li")
      .contains("ONVIF Camera")
      .click();
    cy.contains("Apply").click();
    cy.contains("Asset Class: ONVIF");
  });
  afterEach(() => {
    cy.saveLocalStorage();
  });
});
