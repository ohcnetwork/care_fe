import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";

describe("Location Management Section", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/");
    cy.get("[id='facility-details']").first().click();
    cy.get("[id=manage-facility-dropdown]").should("exist").click();
    cy.get("[id=location-management]").click();
  });

  it("Adds Location", () => {
    cy.contains("Add New Location").click();
    cy.get("[name='name']").type("Test Location");
    cy.get("textarea[name='description']").type("Test Description");
    cy.intercept(/\/api\/v1\/facility\/[\w-]+\/asset_location\//).as(
      "addLocation"
    );
    cy.get("button").contains("Add Location").click();
    cy.wait("@addLocation").then((interception) => {
      switch (interception?.response?.statusCode) {
        case 201:
          cy.verifyNotification("Location created successfully");
          return;
        case 400:
          cy.verifyNotification(
            "Name - Asset location with this name and facility already exists."
          );
          return;
      }
    });
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
