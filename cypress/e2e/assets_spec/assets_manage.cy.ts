/// <reference types="cypress" />
import { AssetPage } from "../../pageobject/Asset/AssetCreation";
import { v4 as uuidv4 } from "uuid";
import LoginPage from "../../pageobject/Login/LoginPage";
import { AssetSearchPage } from "../../pageobject/Asset/AssetSearch";

describe("Asset", () => {
  const assetPage = new AssetPage();
  const assetSearchPage = new AssetSearchPage();
  const loginPage = new LoginPage();
  const phone_number = "9999999999";
  const serialNumber = Math.floor(Math.random() * 10 ** 10).toString();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/assets");
  });

  it("Verify asset creation fields throws error if empty", () => {
    assetPage.createAsset();
    assetPage.selectFacility("Dummy Facility 1");
    assetPage.clickCreateAsset();

    assetPage.verifyEmptyAssetNameError();
    assetPage.verifyEmptyAssetTypeError();
    assetPage.verifyEmptyLocationError();
    assetPage.verifyEmptyStatusError();
    assetPage.verifyEmptyPhoneError();
  });

  //Create an asset

  it("Create an Asset", () => {
    assetPage.createAsset();
    assetPage.selectFacility("Dummy Facility 1");
    assetPage.selectLocation("Camera Loc");
    assetPage.selectAssetType("Internal");
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
      "2021-12-25",
      "Test note for asset creation!"
    );

    assetPage.clickCreateAddMore();
    assetPage.verifySuccessNotification("Asset created successfully");

    const qr_id_2 = uuidv4();

    assetPage.selectLocation("Camera Loc");
    assetPage.selectAssetType("Internal");
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
      "2021-12-25",
      "Test note for asset creation!"
    );

    assetPage.clickCreateAsset();
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
      "Test note for asset creation edited!"
    );

    assetPage.clickUpdateAsset();

    assetPage.verifySuccessNotification("Asset updated successfully");
  });

  it("Delete an Asset", () => {
    assetPage.openCreatedAsset();
    assetPage.deleteAsset();

    assetPage.verifySuccessNotification("Asset deleted successfully");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
