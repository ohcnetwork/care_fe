/// <reference types="cypress" />

import * as cy from "local-cypress";

describe("Inventory Management Section", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.visit("/facility/f8f05c04-5c97-415c-814d-419ecf692d0e");
    cy.contains("Inventory Management").click();
  });

  it("Adds Inventory", () => {
    cy.contains("Add Inventory").click();
    cy.get('[name="id"]').select("PPE");
    cy.get('[name="isIncoming"').select("Add Stock");
    cy.get('[name="quantity"').type("120");
    cy.get('[name="unit"').select("Items");
    cy.get("button").contains("Add Inventory").click();
    cy.verifyNotification("Inventory created successfully");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
