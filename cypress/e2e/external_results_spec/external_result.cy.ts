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

  it("Search by Sample name", () => {
    cy.intercept(/\/api\/v1\/external_result/).as("external_result");
    cy.get("[name='name']").type("akhil");
    cy.wait("@external_result").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });
    cy.url().should("include", "akhil");
  });

  it("Search by phone number", () => {
    cy.intercept(/\/api\/v1\/external_result/).as("external_result");
    cy.get("[placeholder='Search by Phone Number']").type("7387434255");
    cy.wait("@external_result").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });
    cy.url().should("include", "%2B917387434255");
  });

  it("import", () => {
    cy.intercept("POST", "/api/v1/external_result/bulk_upsert").as("import");
    cy.get("div").contains("Import/Export").click();
    cy.get("div").contains("Import Results").click();
    cy.get("[id=result-upload]")
      .selectFile("cypress/fixtures/externalresultsample.csv")
      .wait(100);
    cy.get("button").contains("Save").click();
    cy.wait("@import").then((interception) => {
      expect(interception.response.statusCode).to.equal(202);
    });
  });

  it("export", () => {
    cy.intercept("**", (req: Cypress.Request) => {
      const url = new URL(req.url);
      const params = new URLSearchParams(url.search);
      if (
        req.method === "GET" &&
        url.pathname === "/api/v1/external_result/" &&
        params.get("csv") === "true"
      ) {
        req.alias = "export";
      }
    });
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
