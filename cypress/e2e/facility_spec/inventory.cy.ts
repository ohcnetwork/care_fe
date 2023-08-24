import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

describe("Inventory Management Section", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/");
    cy.viewport(1280, 720);
    cy.intercept("GET", "**/api/v1/facility/**").as("getFacilities");
    cy.get("[id='facility-details']").first().click();
    cy.wait("@getFacilities").its("response.statusCode").should("eq", 200);
    cy.get("#manage-facility-dropdown button").should("be.visible");
    cy.get("[id='manage-facility-dropdown']").scrollIntoView().click();
    cy.get("[id=inventory-management]").click();
  });

  it("Adds Inventory", () => {
    cy.contains("Manage Inventory").click();
    cy.get("div#id").click();
    cy.get("div#id ul li").contains("Liquid Oxygen").click();
    cy.get("div#isIncoming").click();
    cy.get("div#isIncoming ul li").contains("Add Stock").click();
    cy.get("[name='quantity']").type("120");
    cy.get("button").contains("Add/Update Inventory").click();
    cy.verifyNotification("Inventory created successfully");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
