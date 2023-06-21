/// <reference types="cypress" />
import { AssetPage } from "../../pageobject/Asset/AssetCreation";
import { AssetSearchPage } from "../../pageobject/Asset/AssetSearch";
import { AssetQRScanPage } from "../../pageobject/Asset/AssetQRScan";
import { AssetPagination } from "../../pageobject/Asset/AssetPagination";
import { v4 as uuidv4 } from "uuid";

describe("Asset", () => {
  const assetPage = new AssetPage();
  const assetSearchPage = new AssetSearchPage();
  const assetQRScanPage = new AssetQRScanPage();
  const assetPagination = new AssetPagination();
  const phone_number = "9999999999";
  const serialNumber = Math.floor(Math.random() * 10 ** 10).toString();

  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/assets");
  });

  it("Create an Asset", () => {
    assetPage.createAsset();
    assetPage.selectFacility("Dummy Facility 1");
    assetPage.selectLocation("Camera Locations");
    assetPage.selectAssetType("Internal");
    assetPage.selectAssetClass("ONVIF Camera");

    const qr_id = uuidv4();

    assetPage.enterAssetDetails(
      "New Test Asset",
      "Test Description",
      "Working",
      qr_id,
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
  });

  it("Search Asset Name", () => {
    const initialUrl = cy.url();
    assetSearchPage.typeSearchKeyword("dummy camera 30");
    assetSearchPage.pressEnter();
    assetSearchPage.verifyUrlChanged(initialUrl);
  });

  it("Scan Asset QR", () => {
    assetQRScanPage.scanAssetQR();
  });

  it("Next/Previous Page", () => {
    assetPagination.navigateToNextPage();
    assetPagination.navigateToPreviousPage();
  });
});
