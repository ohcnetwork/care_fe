/// <reference types="cypress" />

import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";
import { AssetSearchPage } from "../../pageobject/Asset/AssetSearch";
import { AssetQRScanPage } from "../../pageobject/Asset/AssetQRScan";
import { AssetPagination } from "../../pageobject/Asset/AssetPagination";
import { AssetFilters } from "../../pageobject/Asset/AssetFilters";
import LoginPage from "../../pageobject/Login/LoginPage";

describe("Asset Tab", () => {
  const assetSearchPage = new AssetSearchPage();
  const assetQRScanPage = new AssetQRScanPage();
  const assetPagination = new AssetPagination();
  const assetFilters = new AssetFilters();
  const loginPage = new LoginPage();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/assets");
  });

  // search for a element

  it("Search Asset Name/QR_ID/Serial_number", () => {
    assetSearchPage.typeSearchKeyword("dummy camera 10");
    assetSearchPage.pressEnter();
    assetSearchPage.verifyBadgeContent(
      "Name/Serial No./QR ID: dummy camera 10"
    );
    assetSearchPage.clickAssetByName("Dummy Camera 10");
    assetSearchPage.clickUpdateButton();
    assetSearchPage.clearAndTypeQRCode("340543-05935-04953-05234-04");
    assetSearchPage.clearAndTypeSerialNumber("8989898989898");
    assetSearchPage.clickAssetSubmitButton();
    assetSearchPage.visitAssetsPage();
    assetSearchPage.typeSearchKeyword("340543-05935-04953-05234-04");
    assetSearchPage.pressEnter();
    assetSearchPage.verifyAssetListContains("Dummy Camera 10");
    assetSearchPage.verifyBadgeContent(
      "Name/Serial No./QR ID: 340543-05935-04953-05234-04"
    );
    assetSearchPage.typeSearchKeyword("8989898989898");
    assetSearchPage.verifyAssetListContains("Dummy Camera 10");
    assetSearchPage.verifyBadgeContent("Name/Serial No./QR ID: 8989898989898");
  });

  // scan a asset qr code

  it("Scan Asset QR", () => {
    assetQRScanPage.scanAssetQR();
  });

  // filter the asset and verify the badges are there

  it("Filter Asset", () => {
    assetFilters.filterAssets(
      "Dummy Facility 1",
      "INTERNAL",
      "ACTIVE",
      "ONVIF Camera"
    );
  });

  // Verify the pagination in the page

  it("Next/Previous Page", () => {
    assetPagination.navigateToNextPage();
    assetPagination.navigateToPreviousPage();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
