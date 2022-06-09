/// <reference types="cypress" />
import users from "../../fixtures/users.json";

describe("authentication", () => {
  users.forEach((user) => {
    it("Login as " + user.username + " - " + user.rolename, () => {
      cy.login(user.username, "passwordR0FL");

      // Assert user
      cy.get("a").contains("Profile").click();
      cy.url().should("include", "/user/profile");
      cy.get("dd").should("contain", user.username);
      cy.get("dd").should("contain", user.rolename);
    });
  });
  afterEach(() => {
    cy.log("Logging out");
    cy.get("p").contains("Sign Out").click();
    cy.url().should("include", "/login");
  });
});
