/// <reference types="cypress" />

import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";
import { AssetSearchPage } from "../../pageobject/Asset/AssetSearch";
import { AssetQRScanPage } from "../../pageobject/Asset/AssetQRScan";
import { AssetPagination } from "../../pageobject/Asset/AssetPagination";
import { AssetFilters } from "../../pageobject/Asset/AssetFilters";

describe("Asset Tab", () => {
  const assetSearchPage = new AssetSearchPage();
  const assetQRScanPage = new AssetQRScanPage();
  const assetPagination = new AssetPagination();
  const assetFilters = new AssetFilters();

  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/assets");
  });

  // search for a element

  it("Search Asset Name", () => {
    const initialUrl = cy.url();
    assetSearchPage.typeSearchKeyword("dummy camera 30");
    assetSearchPage.pressEnter();
    assetSearchPage.verifyUrlChanged(initialUrl);
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
