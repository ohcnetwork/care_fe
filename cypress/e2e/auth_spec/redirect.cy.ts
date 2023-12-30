/// <reference types="cypress" />

import { cy, describe, it } from "local-cypress";

describe("redirect", () => {
  it("Check if login redirects to the right url", () => {
    cy.log("Logging in the user staffdev:Coronasafe@123");

    cy.visit("/resource/board");
    cy.get("input[id='username']").type("staffdev");
    cy.get("input[id='password']").type("Coronasafe@123");
    cy.get("button").contains("Login").click();

    cy.get("p").contains("Sign Out").should("exist");
    cy.url().should("include", "/resource/board");
  });

  it("Check if the redirect param works", () => {
    cy.log("Logging in the user staffdev:Coronasafe@123");

    cy.visit("login?redirect=http://localhost:4000/resource/board");
    cy.get("input[id='username']").type("staffdev");
    cy.get("input[id='password']").type("Coronasafe@123");
    cy.get("button").contains("Login").click();

    cy.get("p").contains("Sign Out").should("exist");
    cy.url().should("include", "/resource/board");
  });

  it("Check to ensure that redirect is the same origin", () => {
    cy.log("Logging in the user staffdev:Coronasafe@123");

    cy.visit("login?redirect=https://google.com");
    cy.get("input[id='username']").type("staffdev");
    cy.get("input[id='password']").type("Coronasafe@123");
    cy.get("button").contains("Login").click();

    cy.get("p").contains("Sign Out").should("exist");
    cy.url().should("include", "/facility");
  });
});
