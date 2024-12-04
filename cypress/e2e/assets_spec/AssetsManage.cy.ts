import FacilityHome from "pageobject/Facility/FacilityHome";
import { advanceFilters } from "pageobject/utils/advanceFilterHelpers";

import { AssetPage } from "../../pageobject/Asset/AssetCreation";
import { AssetHome } from "../../pageobject/Asset/AssetHome";
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
  const assetHome = new AssetHome();
  const facilityHome = new FacilityHome();
  const fillFacilityName = "Dummy Facility 40";
  const assetname = "Dummy Camera";
  const locationName = "Dummy Location 1";
  const initiallocationName = "Camera Location";

  before(() => {
    loginPage.loginByRole("districtAdmin");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/assets");
  });

  it("Verify Asset Warranty Expiry Label", () => {
    assetHome.typeAssetSearch(assetname);
    advanceFilters.verifyFilterBadgePresence(
      "Name/Serial No./QR ID",
      assetname,
      true,
    );
    assetHome.clickAssetByName(assetname);
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
    assetHome.typeAssetSearch(assetname);
    advanceFilters.verifyFilterBadgePresence(
      "Name/Serial No./QR ID",
      assetname,
      true,
    );
    assetHome.clickAssetByName(assetname);
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
    assetHome.typeAssetSearch(assetname);
    advanceFilters.verifyFilterBadgePresence(
      "Name/Serial No./QR ID",
      assetname,
      true,
    );
    assetHome.clickAssetByName(assetname);
    assetPage.clickupdatedetailbutton();
    assetPage.clickassetlocation(locationName);
    assetPage.clickUpdateAsset();
    assetPage.verifyassetlocation(locationName);
    assetPage.verifytransactionStatus(initiallocationName, locationName);
  });

  it("Verify Facility Asset Page Redirection", () => {
    facilityHome.navigateToFacilityHomepage();
    facilityHome.typeFacilitySearch(fillFacilityName);
    advanceFilters.verifyFilterBadgePresence(
      "Facility/District Name",
      fillFacilityName,
      true,
    );
    facilityPage.visitAlreadyCreatedFacility();
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickCreateAssetFacilityOption();
    facilityPage.verifyfacilitycreateassetredirection();
    facilityPage.verifyassetfacilitybackredirection();
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickviewAssetFacilityOption();
    facilityPage.verifyfacilityviewassetredirection();
    advanceFilters.verifyFilterBadgePresence(
      "Facility",
      fillFacilityName,
      true,
    );
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
