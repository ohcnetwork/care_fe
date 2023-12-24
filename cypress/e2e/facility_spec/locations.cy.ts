import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import { AssetPage } from "../../pageobject/Asset/AssetCreation";
import { UserCreationPage } from "../../pageobject/Users/UserCreation";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import FacilityLocation from "../../pageobject/Facility/FacilityLocation";

describe("Location Management Section", () => {
  const assetPage = new AssetPage();
  const userCreationPage = new UserCreationPage();
  const facilityPage = new FacilityPage();
  const facilityLocation = new FacilityLocation();
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

  it("Add Single Bed to a facility location and modify it", () => {
    // mandatory field verification in bed creation
    cy.get("#manage-bed-button").first().click();
    cy.get("#add-new-bed").click();
    assetPage.clickassetupdatebutton();
    userCreationPage.verifyErrorMessages(EXPECTED_BED_ERROR_MESSAGES);
    // create a new single bed and verify
    cy.get("#bed-name").clear().click().type("bed-name");
    cy.get("#bed-description").clear().click().type("bed-description");
    cy.get("#bed-type").click();
    cy.get("li[role=option]").contains("ICU").click();
    assetPage.clickassetupdatebutton();
    // Verify the bed creation
    cy.get("#view-bed-name").contains("bed-name");
    cy.get("#view-bedbadges").contains("ICU");
    cy.get("#view-bedbadges").contains("Vacant");
    // edit the created bed

    // verify the modification
  });

  it("Add Multiple Bed to a facility location and delete one bed", () => {
    // create multiple bed and verify
    // verify the bed creation
    // delete a bed and verify it
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
