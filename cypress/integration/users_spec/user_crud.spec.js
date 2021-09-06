/// <reference types="cypress" />

describe("Edit Profile Testing", () => {
  beforeEach(() => {
    cy.login(username, password);

    cy.get("a").contains("Users").click();
    cy.url().should("include", "/user/profile");
  });

  it("create user", () => {
    cy.contains("Add New User").click();
    cy.get('[name="user_type"]').select("Volunteer");
    // TODO: add name attribute for
    // Phone Number, Whatsapp Number, Facilities
    cy.get('[name="username"');
    cy.get('[name="password"]');
    cy.get('[name="c_password"]');
    cy.get('[name="first_name"]');
    cy.get('[name="last_name"]');
    cy.get('[name="email"');
    cy.get('[name="gender"]');
    cy.get('[name="state"]');
    cy.get('[name="district"]');
    cy.get('[name="local_body"]');
  });

  it("view user and verify details", () => {
    // TODO: Filter by username, lastname, etc
    // TODO: view first user that comes
  });

  it("update user", () => {
    // TODO: update user
  });
});
