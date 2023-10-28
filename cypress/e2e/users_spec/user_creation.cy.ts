import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { AssetSearchPage } from "../../pageobject/Asset/AssetSearch";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import { UserPage } from "../../pageobject/Users/UserSearch";

describe("User Creation", () => {
  const userPage = new UserPage();
  const loginPage = new LoginPage();
  const facilityPage = new FacilityPage();
  const assetSearchPage = new AssetSearchPage();
  const fillFacilityName = "Dummy Facility 1";
  const alreadylinkedusersviews = [
    "devstaff2",
    "devdistrictadmin",
    "devdoctor",
  ];

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/users");
  });

  it("view user redirection from facility page", () => {
    cy.visit("/facility");
    assetSearchPage.typeSearchKeyword(fillFacilityName);
    assetSearchPage.pressEnter();
    facilityPage.verifyFacilityBadgeContent(fillFacilityName);
    facilityPage.visitAlreadyCreatedFacility();
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickViewUsersOption();
    userPage.verifyMultipleBadgesWithSameId(alreadylinkedusersviews);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
