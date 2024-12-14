import { AssetHome } from "pageobject/Asset/AssetHome";
import LoginPage from "pageobject/Login/LoginPage";
import { generatePhoneNumber } from "pageobject/utils/constants";
import { pageNavigation } from "pageobject/utils/paginationHelpers";
import { v4 as uuidv4 } from "uuid";

import { AssetPage } from "../../pageobject/Asset/AssetCreation";
import FacilityHome from "../../pageobject/Facility/FacilityHome";
import FacilityLocation from "../../pageobject/Facility/FacilityLocation";

describe("Location Management Section", () => {
  const assetPage = new AssetPage();
  const facilityLocation = new FacilityLocation();
  const facilityHome = new FacilityHome();
  const assetHome = new AssetHome();
  const loginPage = new LoginPage();

  const EXPECTED_LOCATION_ERROR_MESSAGES = [
    "Name is required",
    "Location Type is required",
  ];
  const EXPECTED_BED_ERROR_MESSAGES = [
    "Please enter a name",
    "Please select a bed type",
  ];
  const locationDescription = "Test Description";
  const locationType = "WARD";
  const locationMiddleware = "dev_middleware.coronasafe.live";
  const locationModifiedDescription = "Test Modified Description";
  const locationModifiedType = "ICU";
  const locationModifiedMiddleware = "dev-middleware.coronasafe.live";
  const bedDescrption = "test description";
  const bedType = "ICU";
  const bedStatus = "Vacant";
  const bedModifiedDescrption = "test modified description";
  const bedModifiedType = "Isolation";
  const phone_number = generatePhoneNumber();

  before(() => {
    loginPage.loginByRole("districtAdmin");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/");
  });

  it("Delete location with linked assets", () => {
    const locationName = `ICU-${uuidv4().substring(0, 2)}`;
    const facilityName = "Dummy Facility 13";
    const assetName = "Test Asset linked to location";
    // Select a new facility
    facilityLocation.navigateToFacilityLocationManagement(facilityName);
    // Create a new location
    facilityLocation.clickAddNewLocationButton();
    facilityLocation.fillLocationDetails(
      locationName,
      undefined,
      locationType,
      undefined,
    );
    facilityLocation.clickAddLocationButton();
    facilityLocation.verifyAddLocationSuccessfulMesssage();
    // create asset and link it to location
    assetHome.navigateToAssetsPage();
    assetPage.createAsset();
    assetPage.selectFacility(facilityName);
    assetPage.selectLocation(locationName);
    assetPage.enterAssetDetails({
      name: assetName,
      workingStatus: "Working",
      supportPhone: phone_number,
    });
    assetPage.clickassetupdatebutton();
    cy.verifyNotification("Asset created successfully");
    cy.closeNotification();
    // Select a new facility
    facilityHome.navigateToFacilityHomepage();
    facilityLocation.navigateToFacilityLocationManagement(facilityName);
    facilityLocation.clickDeleteLocation(locationName);
    cy.clickSubmitButton("Confirm");
    cy.verifyNotification("Cannot delete a Location with associated Assets");
    cy.closeNotification();

    // delete asset
    facilityLocation.clickManageAssets();
    assetPage.openCreatedAsset();
    assetPage.deleteAsset();
    cy.verifyNotification("Asset deleted successfully");
    cy.closeNotification();

    // delete location
    facilityHome.navigateToFacilityHomepage();
    facilityLocation.navigateToFacilityLocationManagement(facilityName);
    facilityLocation.clickDeleteLocation(locationName);
    cy.clickSubmitButton("Confirm");
    cy.verifyNotification(`Location ${locationName} deleted successfully`);
    cy.closeNotification();
  });

  it("Delete location with linked beds", () => {
    const locationName = `ICU-${uuidv4().substring(0, 2)}`;
    const facilityName = "Dummy Facility 12";
    const bedName = `Bed-${uuidv4().substring(0, 2)}`;
    // Select a new facility
    facilityLocation.navigateToFacilityLocationManagement(facilityName);
    // Create a new location with a bed
    facilityLocation.clickAddNewLocationButton();
    facilityLocation.fillLocationDetails(
      locationName,
      undefined,
      locationType,
      undefined,
    );
    facilityLocation.clickAddLocationButton();
    facilityLocation.verifyAddLocationSuccessfulMesssage();
    // Create a new bed to the location
    facilityLocation.clickManageBedButton(locationName);
    facilityLocation.clickAddBedButton();
    facilityLocation.fillBedForm(bedName, undefined, bedType, undefined);
    facilityLocation.clickSubmitBedsButton();
    facilityLocation.verifyAddSingleBedSuccessfulMesssage();
    // Now try to delete the location with bed in it
    facilityLocation.fetchAndNavigateToLocationPage();
    facilityLocation.clickDeleteLocation(locationName);
    cy.clickSubmitButton("Confirm");
    cy.verifyNotification("Cannot delete a Location with associated Beds");
    cy.closeNotification();

    // delete bed
    facilityLocation.clickManageBedPopup();
    facilityLocation.deleteBedWithName(bedName);
    cy.clickSubmitButton("Delete");
    cy.verifyNotification("Bed deleted successfully");
    cy.closeNotification();

    // delete location
    facilityLocation.fetchAndNavigateToLocationPage();
    facilityLocation.clickDeleteLocation(locationName);
    cy.clickSubmitButton("Confirm");
    cy.verifyNotification(`Location ${locationName} deleted successfully`);
    cy.closeNotification();
  });

  it("Adds Location to a facility and modify it", () => {
    const locationName = `ICU-${uuidv4().substring(0, 2)}`;
    const locationModifiedName = `ICU-${uuidv4().substring(0, 2)}}`;
    const facilityName = "Dummy Facility 11";
    // Select a new facility
    facilityLocation.navigateToFacilityLocationManagement(facilityName);
    // add a new location form mandatory error
    facilityLocation.clickAddNewLocationButton();
    facilityLocation.clickAddLocationButton();
    cy.verifyErrorMessages(EXPECTED_LOCATION_ERROR_MESSAGES);
    // create a new location
    facilityLocation.fillLocationDetails(
      locationName,
      locationDescription,
      locationType,
      locationMiddleware,
    );
    facilityLocation.clickAddLocationButton();
    facilityLocation.verifyAddLocationSuccessfulMesssage();
    // verify the reflection
    facilityLocation.verifyLocationName(locationName);
    facilityLocation.verifyLocationType(locationType);
    facilityLocation.verifyLocationDescription(locationDescription);
    facilityLocation.verifyLocationMiddleware(locationMiddleware);
    // verify the duplicate location error message
    facilityLocation.clickAddNewLocationButton();
    facilityLocation.fillLocationDetails(
      locationName,
      undefined,
      locationType,
      undefined,
    );
    facilityLocation.clickAddLocationButton();
    cy.verifyNotification(
      "Name - Asset location with this name and facility already exists.",
    );
    cy.closeNotification();
    facilityLocation.closeAddLocationForm();
    facilityLocation.clickEditLocationButton();
    facilityLocation.fillLocationDetails(
      locationModifiedName,
      locationModifiedDescription,
      locationModifiedType,
      locationModifiedMiddleware,
    );
    facilityLocation.clickUpdateLocationButton();
    facilityLocation.verifyEditLocationSuccessfulMessage();
    // verify the reflection
    facilityLocation.verifyLocationName(locationModifiedName);
    facilityLocation.verifyLocationType(locationModifiedType);
    facilityLocation.verifyLocationDescription(locationModifiedDescription);
    facilityLocation.verifyLocationMiddleware(locationModifiedMiddleware);
  });

  it("Add single & Multiple Bed to facility location along with duplication and deleting a bed", () => {
    const locationName = `ICU-${uuidv4().substring(0, 2)}`;
    const facilityName = "Dummy Request Fulfilment Center";
    const bedName = `Bed-${uuidv4().substring(0, 2)}`;
    const duplicateBedName = `Duplicate-${uuidv4().substring(0, 2)}`;
    const multipleBedName = `Multi-${uuidv4().substring(0, 2)}}`;
    const numberOfBeds = 25;
    // Select a new facility
    facilityLocation.navigateToFacilityLocationManagement(facilityName);
    // Create a new location and Bed into it
    facilityLocation.clickAddNewLocationButton();
    facilityLocation.fillLocationDetails(
      locationName,
      undefined,
      locationType,
      undefined,
    );
    facilityLocation.clickAddLocationButton();
    facilityLocation.verifyAddLocationSuccessfulMesssage();
    // Verify the error message of beds creation form
    facilityLocation.clickManageBedButton(locationName);
    facilityLocation.clickAddBedButton();
    facilityLocation.clickSubmitBedsButton();
    cy.verifyErrorMessages(EXPECTED_BED_ERROR_MESSAGES);
    // Add a new bed to the location
    facilityLocation.fillBedForm(bedName, bedDescrption, bedType, undefined);
    facilityLocation.clickSubmitBedsButton();
    facilityLocation.verifyAddSingleBedSuccessfulMesssage();
    // Verify the bed creation
    facilityLocation.verifyBedNameBadge(bedName);
    facilityLocation.verifyBedBadge(bedType);
    facilityLocation.verifyBedBadge(bedStatus);
    // Try to create duplication bed and verify the error
    facilityLocation.clickAddBedButton();
    facilityLocation.fillBedForm(bedName, undefined, bedType, undefined);
    facilityLocation.clickSubmitBedsButton();
    cy.verifyNotification(
      "Name - Bed with same name already exists in location",
    );
    cy.closeNotification();
    facilityLocation.closeAddLocationForm();
    // edit the newly created existing bed
    facilityLocation.clickEditBedButton(bedName);
    facilityLocation.fillBedForm(
      duplicateBedName,
      bedModifiedDescrption,
      bedModifiedType,
      undefined,
    );
    facilityLocation.clickUpdateBedButton();
    facilityLocation.verifyEditBedSuccessfulMessage();
    // verify the modification
    facilityLocation.verifyBedNameBadge(duplicateBedName);
    facilityLocation.verifyBedBadge(bedModifiedType);
    facilityLocation.verifyBedBadge(bedStatus);
    // Create Multiple Bed
    facilityLocation.clickAddBedButton();
    facilityLocation.fillBedForm(
      multipleBedName,
      bedDescrption,
      bedType,
      numberOfBeds,
    );
    facilityLocation.clickSubmitBedsButton();
    // Verify Pagination in the page
    pageNavigation.navigateToNextPage();
    pageNavigation.navigateToPreviousPage();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
