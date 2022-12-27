import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

describe("Sample List", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/sample");
  });

  it("Search by District name", () => {
    cy.intercept(/\/api\/v1\/test_sample/).as("test_sample");
    cy.get("[name='district_name_search']").type("TEst");
    cy.wait("@test_sample").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });
    cy.url().should("include", "TEst");
  });

  it("Search by Patient Name", () => {
    cy.intercept(/\/api\/v1\/test_sample/).as("test_sample");
    cy.get("[name='patient_name_search']").type("Test");
    cy.wait("@test_sample").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });
    cy.url().should("include", "Test");
  });

  it("Update Sample Status", () => {
    cy.contains("UPDATE SAMPLE TEST STATUS").click();
  });

  it("View Sample Details", () => {
    cy.contains("Sample Details").click();
  });

  it("Next/Previous Page", () => {
    // only works for desktop mode
    cy.get("button")
      .should("contain", ">")
      .contains(">")
      .click({ force: true });
    cy.get("button")
      .should("contain", "<")
      .contains("<")
      .click({ force: true });
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
