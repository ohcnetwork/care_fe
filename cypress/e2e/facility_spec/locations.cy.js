/// <reference types="cypress" />

describe("Location Management Section", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.visit("http://localhost:4000");
    cy.get("a").contains("Facility").click({ force: true });
    cy.contains("Location Management").click();
  });

  it("Adds Location", () => {
    cy.contains("Add Location").click();
    cy.get('[name="name"]').type("Test Location");
    cy.get('textarea[name="description"]').type("Test Description");
    cy.get("button").contains("Add Location").click();
    cy.verifyNotification("Location created successfully");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
