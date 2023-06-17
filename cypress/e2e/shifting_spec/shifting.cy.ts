import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";

describe("Shifting Page", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/shifting");
  });

  it("checks if all download button works", () => {
    cy.get("svg.care-svg-icon__baseline.care-l-export").each(($button) => {
      cy.intercept(/\/api\/v1\/shift/).as("shifting_download");
      cy.wrap($button).click({ force: true });
      cy.wait("@shifting_download");
    });
  });

  it("switch between list view and board view", () => {
    cy.contains("List View").click();
    cy.contains("Board View").click();
  });

  it("search patient", () => {
    cy.get("[name='patient_name']").type("Akhil");
    cy.url().should("include", "Akhil");
  });

  it("switch between active/archived", () => {
    cy.intercept(/\/api\/v1\/shift/).as("shifting");
    cy.contains("Archived").click().wait("@shifting");
    cy.contains("Active").should("have.class", "text-primary-500");
    cy.contains("Archived").should("have.class", "text-white");
    cy.intercept(/\/api\/v1\/shift/).as("shifting");
    cy.contains("Active").click().wait("@shifting");
    cy.contains("Active").should("have.class", "text-white");
    cy.contains("Archived").should("have.class", "text-primary-500");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
