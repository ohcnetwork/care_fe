/// <reference types="cypress" />

describe("Edit Profile Testing", () => {
  before(() => {
    cy.login(username, password);
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.visit("http://localhost:4000");
    cy.get("a").contains("Users").click();
    cy.url().should("include", "/user");
  });

  it("create user", () => {
    cy.contains("Add New User").click();
    cy.get('[name="user_type"]').select("Volunteer");
    cy.get('[name="phone_number"]').type("9343234277");
    cy.get('[name="whatsapp_number"]').type("923342343");
    cy.get('[name="facilities"]').type("Harsha");
    cy.get('[name="username"').type("cypress_test");
    cy.get('[name="password"]').type("cypress_test");
    cy.get('[name="c_password"]').type("cypress_test");
    cy.get('[name="first_name"]').type("Cypress Test");
    cy.get('[name="last_name"]').type("Tester");
    cy.get('[name="email"').type("cypress@tester.com");
    cy.get('[name="gender"]').select("Male");
    cy.get('[name="state"]').select("Kerala");
    cy.get('[name="district"]').select("Ernakulam");
    cy.get('[name="local_body"]').select("");
    cy.contains("Save User").click();
  });

  it("view user and verify details", () => {
    cy.contains("Advanced Filters").click();
    cy.get('[name="state"]').select("Kerala");
    cy.get('[name="district"]').select("Ernakulum");
    cy.get('[name="local_body"]').select("");
    cy.get('[name="facility_type"]').select("");
    cy.get('[name="kasp_empanelled"]').select("");
    cy.contains("Apply").click();

    // TODO: some verify task
    cy.get('[name="search"]').type("cypress_test");
  });

  it("update user", () => {
    cy.get('[name="search"]').type("cypress_test");
    cy.contains("Click here to show").click();
    cy.contains("Link new facility").click();
    cy.get('[name="facility"]').type("test{enter}");
    cy.contains("Add").click();
  });

  it("deletes user", () => {
    cy.get('[name="search"]').type("cypress_test");
    cy.contains("Delete").click();
    cy.get("button.font-medium.btn.btn-danger").click();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
