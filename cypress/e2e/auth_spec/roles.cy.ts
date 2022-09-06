import { afterEach, cy, describe, it } from "local-cypress";
import * as users from "../../fixtures/users.json";

describe("authentication", () => {
  users.forEach((user) => {
    it("Login as " + user.username + " - " + user.rolename, () => {
      cy.loginByApi(user.username, "passwordR0FL");
      cy.intercept(/fontawesome/).as("fontawesome");
      cy.intercept(/currentuser/).as("currentuser");
      cy.visit("/user/profile");
      cy.wait("@fontawesome");
      cy.wait("@currentuser");
      cy.get("dd").should("contain", user.username);
      cy.get("dd").should("contain", user.rolename);
    });
  });
  afterEach(() => {
    cy.log("Logging out");
    cy.get("p").contains("Sign Out").click();
    cy.url().should("include", "/");
  });
});
