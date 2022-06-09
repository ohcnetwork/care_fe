/// <reference types="cypress" />

describe("Edit Profile Testing", () => {
  before(() => {
    cy.login("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.visit("http://localhost:4000");
    cy.get("a").contains("External Result").click();
    cy.url().should("include", "/external_results");
  });

  it("Search by Patient name", () => {
    cy.get('[name="search"][placeholder="Search by Patient Name"]')
      .type("akhil")
      .wait(2000)
      .url()
      .should("include", "akhil");
  });

  it("Search by phone number", () => {
    cy.get('[name="search"][placeholder="Search by Phone Number"]')
      .type("4738743424")
      .wait(2000)
      .url()
      .should("include", "4738743424");
  });

  it("upload list", () => {
    cy.contains("Upload List").click().wait(100);
    // TODO: attach file and save
  });

  it("export", () => {
    cy.contains("Export").click().wait(1000);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
