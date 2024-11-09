import { AssetPage } from "../../pageobject/Asset/AssetCreation";
import { AssetFilters } from "../../pageobject/Asset/AssetFilters";
import { AssetSearchPage } from "../../pageobject/Asset/AssetSearch";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import LoginPage from "../../pageobject/Login/LoginPage";

function addDaysToDate(numberOfDays: number) {
  const inputDate = new Date();
  inputDate.setDate(inputDate.getDate() + numberOfDays);
  return inputDate.toISOString().split("T")[0];
}

describe("Asset", () => {
  const assetPage = new AssetPage();
  const loginPage = new LoginPage();
  const facilityPage = new FacilityPage();
  const assetSearchPage = new AssetSearchPage();
  const assetFilters = new AssetFilters();
  const fillFacilityName = "Dummy Facility 40";
  const assetname = "Dummy Camera";
  const locationName = "Dummy Location 1";
  const initiallocationName = "Camera Location";

  before(() => {
    loginPage.loginAsDistrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/assets");
  });

  it("Verify Asset Warranty Expiry Label", () => {
    assetSearchPage.typeSearchKeyword(assetname);
    assetSearchPage.pressEnter();
    assetSearchPage.verifyBadgeContent(assetname);
    assetSearchPage.clickAssetByName(assetname);
    assetPage.clickupdatedetailbutton();
    assetPage.scrollintoWarrantyDetails();
    assetPage.enterWarrantyExpiryDate(addDaysToDate(100)); // greater than 3 months
    assetPage.clickassetupdatebutton();
    assetPage.verifyWarrantyExpiryLabel("");
    assetPage.clickupdatedetailbutton();
    assetPage.scrollintoWarrantyDetails();
    assetPage.enterWarrantyExpiryDate(addDaysToDate(80)); // less than 3 months
    assetPage.clickassetupdatebutton();
    assetPage.verifyWarrantyExpiryLabel("3 months");
    assetPage.clickupdatedetailbutton();
    assetPage.scrollintoWarrantyDetails();
    assetPage.enterWarrantyExpiryDate(addDaysToDate(20)); // less than 1 month
    assetPage.clickassetupdatebutton();
    assetPage.verifyWarrantyExpiryLabel("1 month");
    assetPage.clickupdatedetailbutton();
    assetPage.scrollintoWarrantyDetails();
    assetPage.enterWarrantyExpiryDate(addDaysToDate(100)); // check for greater than 3 months again to verify the label is removed
    assetPage.clickassetupdatebutton();
    assetPage.verifyWarrantyExpiryLabel("");
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

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
