/// <reference types="cypress" />

import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { UserPage } from "../../pageobject/Users/UserSearch";

describe("Asset Tab", () => {
  const userPage = new UserPage();
  const usernameToTest = "devdoctor";
  const currentuser = "devdistrictadmin";
  const loginPage = new LoginPage();
  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/users");
  });

  it("Search by username", () => {
    userPage.checkSearchInputVisibility();
    userPage.typeInSearchInput(usernameToTest);
    userPage.checkUrlForUsername(usernameToTest);
    userPage.checkUsernameText(usernameToTest);
    userPage.checkUsernameBadgeVisibility(true);
    userPage.clearSearchInput();
    userPage.checkUsernameBadgeVisibility(false);
    userPage.typeInSearchInput(usernameToTest);
    userPage.checkUsernameText(usernameToTest);
    userPage.clickRemoveIcon();
    userPage.checkUsernameBadgeVisibility(false);
    userPage.checkUsernameText(currentuser);
  });
  afterEach(() => {
    cy.saveLocalStorage();
  });
});
