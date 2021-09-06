/// <reference types="cypress" />

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
    cy.log("Logging the user out");
    cy.get("p").contains("Sign Out").click();
    cy.url().should("include", "/login");
  });
});
