import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

describe("Location Management Section", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/");
    cy.get("[name='facility-details']").first().click();
    cy.get("[id=manage-facility-dropdown]").should("exist").click();
    cy.get("[id=location-management]").click();
  });

  it("Adds Location", () => {
    cy.contains("Add New Location").click();
    cy.get("[name='name']").type("Test Location");
    cy.get("textarea[name='description']").type("Test Description");
    cy.get("button").contains("Add Location").click();
    cy.verifyNotification("Location created successfully");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
