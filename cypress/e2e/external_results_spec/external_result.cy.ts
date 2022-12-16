import { cy, describe, it, before, beforeEach, afterEach } from "local-cypress";

describe("Edit Profile Testing", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/external_results");
  });

  it("Search by Patient name", () => {
    cy.intercept(/\/api\/v1\/external_result/).as("external_result");
    cy.get("[name='patient_name_search']").type("akhil");
    cy.wait("@external_result").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });
    cy.url().should("include", "akhil");
  });

  it("Search by phone number", () => {
    cy.intercept(/\/api\/v1\/external_result/).as("external_result");
    cy.get("[placeholder='Search by Phone Number']").type("4738743424");
    cy.wait("@external_result").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });
    cy.url().should("include", "%2B91+47387-43424");
  });

  it("import", () => {
    cy.contains("Import/Export").click().wait(100);
    cy.contains("Import Results").click().wait(100);
    // TODO: attach file and save
  });

  it("export", () => {
    cy.intercept("/api/v1/external_result/?csv=true").as("export");
    cy.contains("Import/Export").click().wait(100);
    cy.contains("Export Results").click();
    cy.wait("@export").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
