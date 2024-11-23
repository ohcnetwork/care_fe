import { v4 as uuidv4 } from "uuid";

import { AssetPage } from "../../pageobject/Asset/AssetCreation";
import { AssetSearchPage } from "../../pageobject/Asset/AssetSearch";
import LoginPage from "../../pageobject/Login/LoginPage";

describe("Asset", () => {
  const assetPage = new AssetPage();
  const assetSearchPage = new AssetSearchPage();
  const loginPage = new LoginPage();
  const phone_number = "9999999999";
  const serialNumber = Math.floor(Math.random() * 10 ** 10).toString();

  before(() => {
    loginPage.loginAsDistrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/assets");
  });

  it("Verify asset creation fields throws error if empty", () => {
    assetPage.createAsset();
    assetPage.selectFacility("Dummy Facility 40");
    assetPage.clickCreateAsset();

    assetPage.verifyEmptyAssetNameError();
    assetPage.verifyEmptyLocationError();
    assetPage.verifyEmptyStatusError();
    assetPage.verifyEmptyPhoneError();
  });

  //Create an asset

  it("Create an Asset", () => {
    assetPage.createAsset();
    assetPage.selectFacility("Dummy Facility 40");
    assetPage.selectLocation("Camera Loc");
    assetPage.selectAssetClass("ONVIF Camera");

    const qr_id_1 = uuidv4();

    assetPage.enterAssetDetails(
      "New Test Asset 1",
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

    assetPage.clickCreateAddMore();
    assetPage.verifySuccessNotification("Asset created successfully");

    const qr_id_2 = uuidv4();

    assetPage.selectLocation("Camera Loc");
    assetPage.selectAssetClass("ONVIF Camera");
    assetPage.enterAssetDetails(
      "New Test Asset 2",
      "Test Description",
      "Working",
      qr_id_2,
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

    assetPage.interceptAssetCreation();
    assetPage.clickCreateAsset();
    assetPage.verifyAssetCreation();
    assetPage.verifySuccessNotification("Asset created successfully");

    assetSearchPage.typeSearchKeyword("New Test Asset 2");
    assetSearchPage.pressEnter();
    assetSearchPage.verifyAssetIsPresent("New Test Asset 2");
  });

  it("Edit an Asset", () => {
    assetPage.openCreatedAsset();

    const qr_id = uuidv4();

    assetPage.editAssetDetails(
      "New Test Asset Edited",
      "Test Description Edited",
      qr_id,
      "Manufacturer's Name Edited",
      "Customer Support's Name Edited",
      "Vendor's Name Edited",
      "Test note for asset creation edited!",
      "25122021",
    );

    assetPage.clickUpdateAsset();

    assetPage.verifySuccessNotification("Asset updated successfully");
  });

  it("Verify Editted Asset", () => {
    assetSearchPage.typeSearchKeyword("New Test Asset Edited");
    assetSearchPage.pressEnter();
    assetSearchPage.verifyAssetIsPresent("New Test Asset Edited");
  });

  it("Configure an asset", () => {
    assetPage.openCreatedAsset();
    assetPage.spyAssetConfigureApi();
    assetPage.configureAsset(
      "Host name",
      "192.168.1.64",
      "remote_user",
      "2jCkrCRSeahzKEU",
      "d5694af2-21e2-4a39-9bad-2fb98d9818bd",
    );
    assetPage.clickConfigureAsset();
    assetPage.verifyAssetConfiguration();
  });

  it("Add an vital monitor asset and configure it", () => {
    assetPage.createAsset();
    assetPage.selectFacility("Dummy Facility 40");
    assetPage.selectLocation("Camera Loc");
    assetPage.selectAssetClass("HL7 Vitals Monitor");

    const qr_id_1 = uuidv4();

    assetPage.enterAssetDetails(
      "New Test Asset Vital",
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
    assetPage.interceptAssetCreation();
    assetPage.clickCreateAsset();
    assetPage.verifyAssetCreation();
    assetSearchPage.typeSearchKeyword("New Test Asset Vital");
    assetSearchPage.pressEnter();
    assetPage.openCreatedAsset();
    assetPage.configureVitalAsset("Host name", "192.168.1.20");
    assetPage.clickConfigureVital();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
