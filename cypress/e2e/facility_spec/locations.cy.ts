import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

describe("Location Management Section", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.get("a").contains("Facility").click({ force: true });
    cy.contains("Location Management").click();
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
