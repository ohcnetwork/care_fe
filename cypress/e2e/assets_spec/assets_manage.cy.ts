import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import { AssetPage } from "../../pageobject/Asset/AssetCreation";
import LoginPage from "../../pageobject/Login/LoginPage";
import { AssetSearchPage } from "../../pageobject/Asset/AssetSearch";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import { AssetFilters } from "../../pageobject/Asset/AssetFilters";

describe("Asset", () => {
  const assetPage = new AssetPage();
  const loginPage = new LoginPage();
  const facilityPage = new FacilityPage();
  const assetSearchPage = new AssetSearchPage();
  const assetFilters = new AssetFilters();
  const fillFacilityName = "Dummy Facility 1";
  const assetname = "Dummy Camera";
  const locationName = "Dummy Location 1";
  const initiallocationName = "Camera Location";

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/assets");
  });

  it("Create & Edit a service history and verify reflection", () => {
    assetSearchPage.typeSearchKeyword(assetname);
    assetSearchPage.pressEnter();
    assetSearchPage.verifyBadgeContent(assetname);
    assetSearchPage.clickAssetByName(assetname);
    assetPage.clickupdatedetailbutton();
    assetPage.scrollintonotes();
    assetPage.enterAssetNotes("Dummy Notes");
    assetPage.enterAssetservicedate("01092023");
    assetPage.clickassetupdatebutton();
    assetPage.scrollintoservicehistory();
    assetPage.clickedithistorybutton();
    assetPage.scrollintonotes();
    assetPage.enterAssetNotes("Dummy Notes Editted");
    assetPage.clickassetupdatebutton();
    assetPage.scrollintoservicehistory();
    assetPage.viewassetservicehistorybutton();
    assetPage.openassetservicehistory();
    assetPage.verifyassetupdateservicehistory();
    assetPage.viewassetservicehistorybutton();
  });

  it("Create a asset transaction and verify history", () => {
    assetSearchPage.typeSearchKeyword(assetname);
    assetSearchPage.pressEnter();
    assetSearchPage.verifyBadgeContent(assetname);
    assetSearchPage.clickAssetByName(assetname);
    assetPage.clickupdatedetailbutton();
    assetPage.clickassetlocation(locationName);
    assetPage.clickUpdateAsset();
    assetPage.verifyassetlocation(locationName);
    assetPage.verifytransactionStatus(initiallocationName, locationName);
  });

  it("Verify Facility Asset Page Redirection", () => {
    cy.visit("/facility");
    assetSearchPage.typeSearchKeyword(fillFacilityName);
    assetSearchPage.pressEnter();
    facilityPage.verifyFacilityBadgeContent(fillFacilityName);
    facilityPage.visitAlreadyCreatedFacility();
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickCreateAssetFacilityOption();
    facilityPage.verifyfacilitycreateassetredirection();
    facilityPage.verifyassetfacilitybackredirection();
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickviewAssetFacilityOption();
    facilityPage.verifyfacilityviewassetredirection();
    assetFilters.assertFacilityText(fillFacilityName);
    facilityPage.verifyassetfacilitybackredirection();
  });

  it("Delete an Asset", () => {
    assetPage.openCreatedAsset();
    assetPage.interceptDeleteAssetApi();
    assetPage.deleteAsset();
    assetPage.verifyDeleteStatus();
  });

  it("Verify Facility Asset Page Redirection", () => {
    cy.visit("/facility");
    assetSearchPage.typeSearchKeyword(fillFacilityName);
    assetSearchPage.pressEnter();
    facilityPage.verifyFacilityBadgeContent(fillFacilityName);
    facilityPage.visitAlreadyCreatedFacility();
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickCreateAssetFacilityOption();
    facilityPage.verifyfacilitycreateassetredirection();
    facilityPage.verifyassetfacilitybackredirection();
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickviewAssetFacilityOption();
    facilityPage.verifyfacilityviewassetredirection();
    assetFilters.assertFacilityText(fillFacilityName);
    facilityPage.verifyassetfacilitybackredirection();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
