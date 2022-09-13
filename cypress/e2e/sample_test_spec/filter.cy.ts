import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

describe("Sample Filter", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/");
    cy.get("a").contains("Sample Test").click();
    cy.contains("Advanced Filters").click();
  });

  it("Filter by Status", () => {
    cy.get("[name='status']").select("APPROVED");
  });

  it("Filter by Asset Type", () => {
    cy.get("[name='result']").select("POSITIVE");
  });

  afterEach(() => {
    cy.contains("Apply").click();
    cy.saveLocalStorage();
  });
});
