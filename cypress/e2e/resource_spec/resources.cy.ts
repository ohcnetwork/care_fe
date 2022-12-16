import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

describe("Resource Page", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/resource");
  });

  it("checks if all download button works", () => {
    cy.get("svg.MuiSvgIcon-root.cursor-pointer").each(($button) => {
      cy.intercept(/\/api\/v1\/resource/).as("resource_download");
      cy.wrap($button).click({ force: true });
      cy.wait("@resource_download").then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
      });
    });
  });

  it("switch between active/completed", () => {
    cy.intercept(/\/api\/v1\/resource/).as("resource");
    cy.contains("Completed").click();
    cy.wait("@resource").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });
    cy.contains("Active").should("have.class", "bg-gray-200");
    cy.contains("Completed").should("have.class", "bg-white");
    cy.intercept(/\/api\/v1\/resource/).as("resource");
    cy.contains("Active").click();
    cy.wait("@resource").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });
    cy.contains("Active").should("have.class", "bg-white");
    cy.contains("Completed").should("have.class", "bg-gray-200");
  });

  it("switch between list view and board view", () => {
    cy.contains("List View").click();
    cy.contains("Board View").click();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
