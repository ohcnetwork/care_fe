import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import { AssetPage } from "../../pageobject/Asset/AssetCreation";
import { UserCreationPage } from "../../pageobject/Users/UserCreation";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import FacilityLocation from "../../pageobject/Facility/FacilityLocation";
import { AssetPagination } from "../../pageobject/Asset/AssetPagination";
import FacilityHome from "../../pageobject/Facility/FacilityHome";

describe("Location Management Section", () => {
  const assetPage = new AssetPage();
  const userCreationPage = new UserCreationPage();
  const facilityPage = new FacilityPage();
  const facilityLocation = new FacilityLocation();
  const assetPagination = new AssetPagination();
  const facilityHome = new FacilityHome();

  const EXPECTED_LOCATION_ERROR_MESSAGES = [
    "Name is required",
    "Location Type is required",
  ];
  const EXPECTED_BED_ERROR_MESSAGES = [
    "Please enter a name",
    "Please select a bed type",
  ];
  const locationName = "Test-location";
  const locationDescription = "Test Description";
  const locationType = "WARD";
  const locationMiddleware = "dev_middleware.coronasafe.live";
  const locationModifiedName = "Test Modified location";
  const locationModifiedDescription = "Test Modified Description";
  const locationModifiedType = "ICU";
  const locationModifiedMiddleware = "dev-middleware.coronasafe.live";
  const bedName = "Test-Bed";
  const bedDescrption = "test description";
  const bedType = "ICU";
  const bedStatus = "Vacant";
  const bedModifiedName = "test modified bed";
  const bedModifiedDescrption = "test modified description";
  const bedModifiedType = "Isolation";
  const numberOfBeds = 10;
  const numberOfModifiedBeds = 25;

  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/");
    cy.intercept("GET", "**/api/v1/facility/**").as("getFacilities");
    cy.get("[id='facility-details']").first().click();
    cy.wait("@getFacilities").its("response.statusCode").should("eq", 200);
    cy.get("h1.text-3xl.font-bold", { timeout: 10000 }).should("be.visible");
    cy.get("#manage-facility-dropdown button").should("be.visible");
    cy.get("[id='manage-facility-dropdown']").scrollIntoView().click();
    cy.get("[id=location-management]").click();
  });

  it("Add a Bed to facility location along with duplication and deleting a bed", () => {
    // mandatory field verification in bed creation
    facilityLocation.clickManageBedButton();
    facilityLocation.clickAddBedButton();
    assetPage.clickassetupdatebutton();
    userCreationPage.verifyErrorMessages(EXPECTED_BED_ERROR_MESSAGES);
    // create a new single bed and verify
    facilityLocation.enterBedName(bedName);
    facilityLocation.enterBedDescription(bedDescrption);
    facilityLocation.selectBedType(bedType);
    assetPage.clickassetupdatebutton();
    // Verify the bed creation
    facilityLocation.verifyBedNameBadge(bedName);
    facilityLocation.verifyBedBadge(bedType);
    facilityLocation.verifyBedBadge(bedStatus);
    // Try to create duplication bed and verify the error
    facilityLocation.clickAddBedButton();
    facilityLocation.enterBedName(bedName);
    facilityLocation.selectBedType(bedType);
    assetPage.clickassetupdatebutton();
    facilityLocation.verifyNotification(
      "Name - Bed with same name already exists in location"
    );
    facilityHome.verifyAndCloseNotifyModal();
    // edit the created bed
    facilityLocation.clickEditBedButton();
    facilityLocation.enterBedName(bedModifiedName);
    facilityLocation.enterBedDescription(bedModifiedDescrption);
    facilityLocation.selectBedType(bedModifiedType);
    assetPage.clickassetupdatebutton();
    // verify the modification
    facilityLocation.verifyBedNameBadge(bedModifiedName);
    facilityLocation.verifyBedBadge(bedModifiedType);
    facilityLocation.verifyBedBadge(bedStatus);
  });

  it("Adds Location to a facility and modify it", () => {
    // add a new location form mandatory error
    facilityLocation.clickAddNewLocationButton();
    assetPage.clickassetupdatebutton();
    userCreationPage.verifyErrorMessages(EXPECTED_LOCATION_ERROR_MESSAGES);
    // create a new location
    facilityPage.fillFacilityName(locationName);
    facilityLocation.fillDescription(locationDescription);
    facilityLocation.selectLocationType(locationType);
    facilityLocation.fillMiddlewareAddress(locationMiddleware);
    assetPage.clickassetupdatebutton();
    // verify the reflection
    facilityLocation.verifyLocationName(locationName);
    facilityLocation.verifyLocationType(locationType);
    facilityLocation.verifyLocationDescription(locationDescription);
    facilityLocation.verifyLocationMiddleware(locationMiddleware);
    // modify the existing data
    facilityLocation.clickEditLocationButton();
    facilityPage.fillFacilityName(locationModifiedName);
    facilityLocation.fillDescription(locationModifiedDescription);
    facilityLocation.selectLocationType(locationModifiedType);
    facilityLocation.fillMiddlewareAddress(locationModifiedMiddleware);
    assetPage.clickassetupdatebutton();
    // verify the reflection
    facilityLocation.verifyLocationName(locationModifiedName);
    facilityLocation.verifyLocationType(locationModifiedType);
    facilityLocation.verifyLocationDescription(locationModifiedDescription);
    facilityLocation.verifyLocationMiddleware(locationModifiedMiddleware);
  });

  it("Multiple Bed to a facility location and delete a bed", () => {
    // create multiple bed and verify
    facilityLocation.clickManageBedButton();
    facilityLocation.clickAddBedButton();
    facilityLocation.enterBedName(bedName);
    facilityLocation.enterBedDescription(bedDescrption);
    facilityLocation.selectBedType(bedType);
    facilityLocation.setMultipleBeds(numberOfBeds);
    assetPage.clickassetupdatebutton();
    // verify the bed creation
    facilityLocation.verifyBedBadge(bedType);
    facilityLocation.verifyBedBadge(bedStatus);
    facilityLocation.verifyIndividualBedName(bedName, numberOfBeds);
    // delete a bed and verify it
    facilityLocation.deleteFirstBed();
    facilityLocation.deleteBedRequest();
    assetPage.clickassetupdatebutton();
    facilityLocation.deleteBedRequest();
  });

  it("Add Multiple Bed to a facility location and verify pagination", () => {
    // bed creation
    facilityLocation.clickManageBedButton();
    facilityLocation.clickAddBedButton();
    facilityLocation.enterBedName(bedModifiedName);
    facilityLocation.enterBedDescription(bedModifiedDescrption);
    facilityLocation.selectBedType(bedModifiedType);
    facilityLocation.setMultipleBeds(numberOfModifiedBeds);
    assetPage.clickassetupdatebutton();
    // pagination
    assetPagination.navigateToNextPage();
    assetPagination.navigateToPreviousPage();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
