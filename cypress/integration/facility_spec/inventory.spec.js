/// <reference types="cypress" />

describe("Inventory Management Section", () => {
  beforeEach(() => {
    cy.login("devdistrictadmin", "Coronasafe@123");
    cy.contains("View Facility").click();
    cy.contains("Inventory Management").click();
  });

  it("Adds Inventory", () => {
    cy.contains("Add Inventory").click();
    cy.get('[name="id"]').select("Rice");
    cy.get('[name="isIncoming"').select("Add Stock");
    cy.get('[name="quantity"').type("120");
    cy.get('[name="unit"').select("Items");
    cy.contains("Add Inventory").click();
    cy.verifyNotification("Inventory created successfully");
  });
});
