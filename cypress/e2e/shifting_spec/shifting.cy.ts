import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

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
    cy.get("svg.MuiSvgIcon-root.cursor-pointer").each(($button) => {
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
    cy.get("[name='patient_name_search']").type("Akhil");
    cy.url().should("include", "Akhil");
  });

  it("switch between active/completed", () => {
    cy.intercept(/\/api\/v1\/shift/).as("shifting");
    cy.contains("Completed").click().wait("@shifting");
    cy.contains("Active").should("have.class", "bg-gray-200");
    cy.contains("Completed").should("have.class", "bg-white");
    cy.intercept(/\/api\/v1\/shift/).as("shifting");
    cy.contains("Active").click().wait("@shifting");
    cy.contains("Active").should("have.class", "bg-white");
    cy.contains("Completed").should("have.class", "bg-gray-200");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
