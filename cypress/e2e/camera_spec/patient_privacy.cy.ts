import { cy, describe, before, beforeEach, it } from "local-cypress";
const user = { username: "devdistrictadmin", password: "Coronasafe@123" };

describe("Patient Privacy", () => {
  before(() => {
    cy.loginByApi(user.username, user.password);
    cy.saveLocalStorage();
  });
  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/patients");
    cy.intercept("**/api/v1/consultation/**").as("consultation");
    cy.get("input[id='name']").type("Patient 1");
    cy.contains("a", "Patient 1").click();
    cy.wait("@consultation");
    cy.get("a").contains("Camera Feed").click();
    cy.wait("@consultation");
  });

  it("Toggle privacy", () => {
    cy.intercept("**/api/v1/consultationbed/**").as("togglePrivacy");
    cy.get("button[id='privacy-toggle']").click();
    cy.wait("@togglePrivacy");
  });
});
