/// <reference types="cypress" />

import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { UserPage } from "../../pageobject/Users/UserSearch";

describe("User Homepage", () => {
  const userPage = new UserPage();
  const usernameToTest = "devdoctor";
  const currentuser = "devdistrictadmin";
  const loginPage = new LoginPage();
  const phone_number = "9876543219";
  const alt_phone_number = "9876543219";

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/users");
  });

  it("User advance filter functionality", () => {
    userPage.clickAdvancedFilters();
    userPage.typeInFirstName("Dev");
    userPage.typeInLastName("Doctor");
    userPage.selectRole("Doctor");
    userPage.selectState("Kerala");
    userPage.selectDistrict("Ernakulam");
    userPage.typeInPhoneNumber(phone_number);
    userPage.typeInAltPhoneNumber(alt_phone_number);
    userPage.applyFilter();
    userPage.verifyUrlafteradvancefilter();
    userPage.checkUsernameText(usernameToTest);
    userPage.verifyDataTestIdText("First Name", "First Name: Dev");
    userPage.verifyDataTestIdText("Last Name", "Last Name: Doctor");
    userPage.verifyDataTestIdText(
      "Phone Number",
      "Phone Number: +919876543219"
    );
    userPage.verifyDataTestIdText(
      "WhatsApp no.",
      "WhatsApp no.: +919876543219"
    );
    userPage.verifyDataTestIdText("Role", "Role: Doctor");
    userPage.verifyDataTestIdText("District", "District: Ernakulam");
    userPage.clearFilters();
    userPage.verifyDataTestIdNotVisible("First Name");
    userPage.verifyDataTestIdNotVisible("Last Name");
    userPage.verifyDataTestIdNotVisible("Phone Number");
    userPage.verifyDataTestIdNotVisible("WhatsApp no.");
    userPage.verifyDataTestIdNotVisible("Role");
    userPage.verifyDataTestIdNotVisible("District");
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

  it("Next/Previous Page Navigation", () => {
    userPage.navigateToNextPage();
    userPage.verifyCurrentPageNumber(2);
    userPage.navigateToPreviousPage();
    userPage.verifyCurrentPageNumber(1);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
