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
    cy.get("input[id='name']").type("Dummy Patient 16");
    cy.contains("a", "Dummy Patient 16").click();
    cy.wait("@consultation");
    // assign bed to patient
    cy.get("button").contains("Assign Bed").click();
    cy.get("input[name='bed']").type("Dummy Bed 6");
    cy.get("li[role='option']").contains("Dummy Bed 6").click();
    cy.wait(2000);
    cy.get("button").contains("Move to bed").click();
    cy.wait(2000);
    // open the feeds page
    cy.url().then((urlValue) => cy.awaitUrl(urlValue + "/feed"));
    cy.wait("@consultation");
  });

  it("Toggle privacy", () => {
    cy.intercept("**/api/v1/consultationbed/**").as("togglePrivacy");
    cy.get("button[id='privacy-toggle']").click();
    cy.wait("@togglePrivacy");
  });
});
