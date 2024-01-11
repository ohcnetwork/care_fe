/// <reference types="cypress" />

import { cy, describe, it, beforeEach } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";

describe("redirect", () => {
  const loginPage = new LoginPage();

  beforeEach(() => {
    cy.log("Logging in the user staffdev:Coronasafe@123");
  });

  it("Check if login redirects to the right url", () => {
    cy.visit("/resource/board");
    loginPage.loginManuallyAsStaff();
    loginPage.CheckIfLoggedIn();
    cy.url().should("include", "/resource/board");
  });

  it("Check if the redirect param works", () => {
    cy.visit("login?redirect=http://localhost:4000/resource/board");
    loginPage.loginManuallyAsStaff();
    loginPage.CheckIfLoggedIn();
    cy.url().should("include", "/resource/board");
  });

  it("Check to ensure that redirect is the same origin", () => {
    cy.visit("login?redirect=https://google.com");
    loginPage.loginManuallyAsStaff();
    loginPage.CheckIfLoggedIn();
    cy.url().should("include", "/facility");
  });
});
