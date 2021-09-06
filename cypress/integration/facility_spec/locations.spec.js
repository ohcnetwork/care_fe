/// <reference types="cypress" />

describe("Location Management Section", () => {
  beforeEach(() => {
    cy.login("devdistrictadmin", "Coronasafe@123");
    cy.contains("View Facility").click();
    cy.contains("Location Management").click();
  });

  it("Adds Location", () => {
    cy.contains("Add Location").click();
    cy.get('[name="name"]').type("Test Location");
    cy.get('[name="description"').type("Test Description");
    cy.contains("Add Location").click();
    cy.verifyNotification("Location created successfully");
  });
});
