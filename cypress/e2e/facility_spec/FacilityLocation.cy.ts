import { pageNavigation } from "pageobject/utils/paginationHelpers";
import { v4 as uuidv4 } from "uuid";

import { AssetPage } from "../../pageobject/Asset/AssetCreation";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import FacilityHome from "../../pageobject/Facility/FacilityHome";
import FacilityLocation from "../../pageobject/Facility/FacilityLocation";
import { UserCreationPage } from "../../pageobject/Users/UserCreation";

describe("Location Management Section", () => {
  const assetPage = new AssetPage();
  const userCreationPage = new UserCreationPage();
  const facilityPage = new FacilityPage();
  const facilityLocation = new FacilityLocation();
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
  const locationNameTwo = "Test-location-2";
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
  const qr_id_1 = uuidv4();
  const phone_number = "9999999999";
  const serialNumber = Math.floor(Math.random() * 10 ** 10).toString();

  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/");
    facilityLocation.loadLocationManagementPage("Dummy Shifting Center");
  });

  it("Add a Bed to facility location along with duplication and deleting a bed", () => {
    // mandatory field verification in bed creation
    cy.get("body").then(($body) => {
      if ($body.find("#manage-bed-button:visible").length) {
        // If the '#manage-bed-button' is visible
        facilityLocation.clickManageBedButton();
      } else {
        // If the '#manage-bed-button' is not visible
        facilityLocation.clickAddNewLocationButton();
        facilityPage.fillFacilityName(locationName);
        facilityLocation.selectLocationType(locationType);
        assetPage.clickassetupdatebutton();
        facilityLocation.clickNotification();
        facilityLocation.clickManageBedButton();
      }
    });
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
      "Name - Bed with same name already exists in location",
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
    facilityLocation.closeNotification();
  });

  it("Adds Location to a facility and modify it", () => {
    // add a new location form mandatory error
    facilityLocation.clickAddNewLocationButton();
    assetPage.clickassetupdatebutton();
    userCreationPage.verifyErrorMessages(EXPECTED_LOCATION_ERROR_MESSAGES);
    // create a new location
    facilityPage.fillFacilityName(locationNameTwo);
    facilityLocation.fillDescription(locationDescription);
    facilityLocation.selectLocationType(locationType);
    facilityLocation.fillMiddlewareAddress(locationMiddleware);
    assetPage.clickassetupdatebutton();
    facilityLocation.clickNotification();
    // verify the reflection
    facilityLocation.verifyLocationName(locationNameTwo);
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
    facilityLocation.closeNotification();
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
    facilityLocation.clickNotification();
    // verify the bed creation
    facilityLocation.verifyBedBadge(bedType);
    facilityLocation.verifyBedBadge(bedStatus);
    facilityLocation.verifyIndividualBedName(bedName, numberOfBeds);
    // delete a bed and verify it
    facilityLocation.deleteFirstBed();
    facilityLocation.deleteBedRequest();
    assetPage.clickassetupdatebutton();
    facilityLocation.deleteBedRequest();
    facilityLocation.closeNotification();
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
    pageNavigation.navigateToNextPage();
    pageNavigation.navigateToPreviousPage();
    facilityLocation.closeNotification();
  });

  it("Delete location", () => {
    facilityLocation.clickAddNewLocationButton();
    facilityLocation.enterLocationName("Test Location");
    facilityLocation.selectLocationType("OTHER");
    assetPage.clickassetupdatebutton();
    facilityLocation.deleteLocation("Test Location");
    assetPage.clickassetupdatebutton();
    facilityLocation.verifyNotification(
      "Location Test Location deleted successfully",
    );
    facilityLocation.closeNotification();
  });

  it("Delete location with linked beds", () => {
    facilityLocation.clickAddNewLocationButton();
    facilityLocation.enterLocationName("Test Location with Beds");
    facilityLocation.selectLocationType("OTHER");
    cy.clickSubmitButton("Add Location");
    cy.verifyNotification("Location created successfully");
    cy.closeNotification();
    facilityLocation.clickManageBedButton();
    facilityLocation.clickAddBedButton();
    facilityLocation.enterBedName("Bed 1");
    facilityLocation.selectBedType("Regular");
    cy.clickSubmitButton("Add Bed(s)");
    cy.verifyNotification("1 Bed created successfully");
    cy.closeNotification();
    facilityLocation.loadLocationManagementPage("Dummy Shifting Center");
    facilityLocation.deleteLocation("Test Location with Beds");
    assetPage.clickassetupdatebutton();
    facilityLocation.verifyNotification(
      "Cannot delete a Location with associated Beds",
    );
    facilityLocation.closeNotification();

    // delete bed
    facilityLocation.clickManageBeds();
    facilityLocation.deleteFirstBed();
    assetPage.clickassetupdatebutton();
    facilityLocation.closeNotification();

    // delete location
    facilityLocation.loadLocationManagementPage("Dummy Shifting Center");
    facilityLocation.deleteLocation("Test Location with Beds");
    assetPage.clickassetupdatebutton();
    facilityLocation.verifyNotification(
      "Location Test Location with Beds deleted successfully",
    );
    facilityLocation.closeNotification();
  });

  it("Delete location with linked assets", () => {
    facilityLocation.clickAddNewLocationButton();
    facilityLocation.enterLocationName("Test Location with linked Assets");
    facilityLocation.selectLocationType("OTHER");
    assetPage.clickassetupdatebutton();
    facilityLocation.verifyNotification("Location created successfully");
    facilityLocation.closeNotification();
    // create asset and link it to location
    cy.awaitUrl("/assets");
    assetPage.createAsset();
    assetPage.selectFacility("Dummy Shifting Center");
    assetPage.selectLocation("Test Location with linked Assets");
    assetPage.enterAssetDetails(
      "Test Asset linked to Facility",
      "Test Description",
      "Working",
      qr_id_1,
      "Manufacturer's Name",
      "2025-12-25",
      "Customer Support's Name",
      phone_number,
      "email@support.com",
      "Vendor's Name",
      serialNumber,
      "25122021",
      "Test note for asset creation!",
    );
    assetPage.clickassetupdatebutton();
    facilityLocation.loadLocationManagementPage("Dummy Shifting Center");
    facilityLocation.deleteLocation("Test Location with linked Assets");
    assetPage.clickassetupdatebutton();
    facilityLocation.verifyNotification(
      "Cannot delete a Location with associated Assets",
    );
    facilityLocation.closeNotification();

    // delete asset
    facilityLocation.clickManageAssets();
    assetPage.openCreatedAsset();
    assetPage.deleteAsset();
    facilityLocation.closeNotification();

    // delete location
    facilityLocation.loadLocationManagementPage("Dummy Shifting Center");
    facilityLocation.deleteLocation("Test Location with linked Assets");
    assetPage.clickassetupdatebutton();
    facilityLocation.verifyNotification(
      "Location Test Location with linked Assets deleted successfully",
    );
    facilityLocation.closeNotification();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
