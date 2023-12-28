import { cy, describe, before, beforeEach, it } from "local-cypress";
const user = { username: "devdistrictadmin", password: "Coronasafe@123" };
describe("Camera Boundary", () => {
  before(() => {
    cy.loginByApi(user.username, user.password);
    cy.saveLocalStorage();
  });
  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/assets");
    cy.get("input[id='search']").type("Dummy Camera 30");
    cy.contains("a", "Dummy Camera").click();
    cy.get("button[id='configure-asset']").click();
  });

  it("Add new boundary", () => {
    cy.get("input[name='bed']").type("Dummy Bed 4");
    cy.get("li[role='option']").contains("Dummy Bed 4").click();
    cy.wait(2000);
    cy.get("button[id='add-boundary-preset']").click();
    cy.get("label[id='boundary-preset-name']").should("exist");
  });

  it("Update boundary", () => {
    cy.get("input[name='bed']").type("Dummy Bed 4");
    cy.get("li[role='option']").contains("Dummy Bed 4").click();
    cy.wait(2000);
    cy.get("button[id='update-boundary-preset']").click();
    cy.intercept("**/api/v1/assetbed/**").as("updateBoundary");
    cy.get("button")
      .find("svg.care-svg-icon__baseline.care-l-angle-right")
      .should("be.visible")
      .first()
      .click();
    cy.wait("@updateBoundary");
    cy.get("button").contains("Next").click();
    cy.get("button")
      .find("svg.care-svg-icon__baseline.care-l-angle-right")
      .should("be.visible")
      .first()
      .click();
    cy.wait("@updateBoundary");
    cy.get("button").contains("Next").click();
    cy.get("button")
      .find("svg.care-svg-icon__baseline.care-l-angle-up")
      .should("be.visible")
      .first()
      .click();
    cy.wait("@updateBoundary");
    cy.get("button").contains("Next").click();
    cy.get("button")
      .find("svg.care-svg-icon__baseline.care-l-angle-down")
      .should("be.visible")
      .first()
      .click();
    cy.wait("@updateBoundary");
    cy.get("button").contains("Done").click();
  });

  it("Delete boundary", () => {
    cy.get("input[name='bed']").type("Dummy Bed 4");
    cy.get("li[role='option']").contains("Dummy Bed 4").click();
    cy.wait(1000);
    cy.intercept("**/api/v1/assetbed/**").as("deleteBoundary");
    cy.get("button[id='delete-boundary-preset']").click();
    cy.get("button").contains("Delete").click();
    cy.wait("@deleteBoundary");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
