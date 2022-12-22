import {
  cy,
  describe,
  it,
  before,
  beforeEach,
  afterEach,
  expect,
} from "local-cypress";

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
    cy.wait(500);
    cy.intercept("POST", "/api/v1/external_result/bulk_upsert").as("import");
    cy.get("[id='export-menu'] > div > button").click();
    cy.get("div").contains("Import Results").click({ force: true });
    cy.get("[id=result-upload]")
      .selectFile("cypress/fixtures/external-result_sample.csv")
      .wait(100);
    cy.get("button").contains("Save").click({ force: true });
    cy.wait("@import").then((interception) => {
      expect(interception.response.statusCode).to.equal(202);
    });
  });

  it("export", () => {
    cy.wait(500);
    cy.intercept("/api/v1/external_result/?csv=true").as("export");
    cy.get("[id='export-menu'] > div > button").wait(100).click();
    cy.get("div").contains("Export Results").click({ force: true });
    cy.wait("@export").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });
  });

  it("edit the record", () => {
    cy.get("[id='usr_0'] > td > div").contains("Test 1").click({ force: true });
    cy.get("button[id='update']").click({ force: true });
    cy.get("[name='address']").clear().type("Testing");
    cy.get("select[name='local_body']").select(1);
    cy.get("select[name='ward']").select(2);
    cy.get("input[value='true']").click();
    cy.get("button[type='submit']").click({ force: true });
    cy.verifyNotification("External Result updated successfully");
  });

  it("delete the record", () => {
    cy.get("[id='usr_0'] > td > div").contains("Test 1").click({ force: true });
    cy.get("button[id='delete']").click({ force: true });
    cy.get("[role='dialog']").contains("DELETE").click({ force: true });
    cy.verifyNotification("Record has been deleted successfully");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
