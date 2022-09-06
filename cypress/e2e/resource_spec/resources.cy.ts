import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

describe("Resource Page", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.intercept(/fontawesome/).as("fontawesome");
    cy.intercept(/currentuser/).as("currentuser");
    cy.visit("/resource");
    cy.wait("@fontawesome");
    cy.wait("@currentuser");
  });

  it("checks if all download button works", () => {
    cy.get("svg.MuiSvgIcon-root.cursor-pointer").each(($button) => {
      cy.wrap($button).click({ force: true }).wait(100);
    });
  });

  it("switch between list view and board view", () => {
    cy.contains("List View").click();
    cy.wait(1000);
    cy.contains("Board View").click();
  });

  it("switch between active/completed", () => {
    cy.contains("Completed").click().wait(2000);
    cy.contains("Active").should("have.class", "bg-gray-200");
    cy.contains("Completed").should("have.class", "bg-white");

    cy.contains("Active").click().wait(2000);
    cy.contains("Active").should("have.class", "bg-white");
    cy.contains("Completed").should("have.class", "bg-gray-200");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
