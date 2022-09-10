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
    cy.get("[name='search'][placeholder='Search by Patient Name']")
      .type("akhil")
      .wait(2000)
      .url()
      .should("include", "akhil");
  });

  it("Search by phone number", () => {
    cy.get("[placeholder='Search by Phone Number']")
      .type("4738743424")
      .wait(2000)
      .url()
      .should("include", "%2B91+47387-43424");
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
