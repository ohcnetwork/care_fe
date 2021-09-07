/// <reference types="cypress" />

describe("Inventory Management Section", () => {
  before(() => {
    cy.login("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.visit("http://localhost:4000");
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

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
