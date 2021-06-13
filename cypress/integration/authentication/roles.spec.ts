import { cy, it, describe, afterEach } from "local-cypress";

const users = [
  {
    username: "karadmin",
    rolename: "DistrictAdmin",
  },
  {
    username: "karadminro",
    rolename: "DistrictReadOnlyAdmin",
  },
  {
    username: "karstaff",
    rolename: "Staff",
  },
  {
    username: "karstaffro",
    rolename: "StaffReadOnly",
  },
  {
    username: "karlocal",
    rolename: "LocalBodyAdmin",
  },
  {
    username: "karward",
    rolename: "WardAdmin",
  },
  {
    username: "kardoc",
    rolename: "Doctor",
  },
  {
    username: "karpharma",
    rolename: "Pharmacist",
  },
  {
    username: "karvol",
    rolename: "Volunteer",
  },
];

describe("authentication", () => {
  afterEach(() => {
    cy.log("Logging the user out");
    cy.get("p").contains("Sign Out").click();
    cy.url().should("include", "/login");
  });

  users.forEach((user) => {
    it("Login as " + user.username + " - " + user.rolename, () => {
      cy.visit("http://localhost:4000/");

      // Login
      cy.get('input[name="username"]').type(user.username);
      cy.get('input[name="password"]').type("passwordR0FL");
      cy.get("button").contains("Login").click();

      // Check URL
      cy.url().should("include", "/facility");

      // Assert user
      cy.get("a").contains("Profile").click();
      cy.url().should("include", "/user/profile");
      cy.get("dd").should("contain", user.username);
      cy.get("dd").should("contain", user.rolename);
    });
  });
});
