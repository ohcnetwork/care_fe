import { afterEach, cy, describe, it } from "local-cypress";
import * as users from "../../fixtures/users.json";

describe("authentication", () => {
  users.forEach((user) => {
    it("Login as " + user.username + " - " + user.rolename, () => {
      cy.loginByApi(user.username, "passwordR0FL");
      cy.visitWait("/user/profile");
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
