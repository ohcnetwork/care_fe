import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";

describe("Location Management Section", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.restoreLocalStorage();
    cy.awaitUrl("/");
    cy.intercept("GET", "**/api/v1/facility/**").as("getFacilities");
    cy.get("[id='facility-details']").first().click();
    cy.wait("@getFacilities").its("response.statusCode").should("eq", 200);
    cy.get("h1.text-3xl.font-bold", { timeout: 10000 }).should("be.visible");
    cy.get("#manage-facility-dropdown button").should("be.visible");
    cy.get("[id='manage-facility-dropdown']").scrollIntoView().click();
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
