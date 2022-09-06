import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

describe("Inventory Management Section", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.intercept(/fontawesome/).as("fontawesome");
    cy.intercept(/currentuser/).as("currentuser");
    cy.visit("/");
    cy.wait("@fontawesome");
    cy.wait("@currentuser");
    cy.get("a")
      .should("contain", "Facility")
      .contains("Facility")
      .click({ force: true });
    cy.contains("Inventory Management").click();
  });

  it("Adds Inventory", () => {
    cy.contains("Manage Inventory").click();
    cy.get("[name='id']").select("PPE");
    cy.get("[name='isIncoming']").select("Add Stock");
    cy.get("[name='quantity']").type("120");
    cy.get("[name='unit']").select("Items");
    cy.get("button").contains("Add/Update Inventory").click();
    cy.verifyNotification("Inventory created successfully");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
