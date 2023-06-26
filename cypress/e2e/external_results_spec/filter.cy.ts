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

  it("Advance Filter", () => {
    cy.get("#local_bodies").click();
    cy.get("[role='option']").should("be.visible");
    cy.contains("[role='option']", "Aluva").click();
    cy.get("#local_bodies").click();
    cy.get("#wards").click();
    cy.get("[role='option']").should("be.visible");
    cy.contains("[role='option']", "12").click();
    cy.contains("Apply").click();
  });

  it("filter by date", () => {
    cy.get("input[name='created_date_start']").click();
    cy.get("[id^='headlessui-popover-panel-'] .care-l-angle-left-b").click();
    cy.get("div[id='date-1']").click();
    cy.get("div[id='date-8']").click();
    cy.get("input[name='result_date_start']").click();
    cy.get("[id^='headlessui-popover-panel-'] .care-l-angle-left-b").click();
    cy.get("div[id='date-1']").click();
    cy.get("div[id='date-8']").click();
    cy.get("input[name='sample_collection_date_start']").click();
    cy.get("[id^='headlessui-popover-panel-'] .care-l-angle-left-b").click();
    cy.get("div[id='date-1']").click();
    cy.get("div[id='date-8']").click();
    cy.contains("Apply").click();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
