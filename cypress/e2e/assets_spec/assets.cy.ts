/// <reference types="cypress" />
import { AssetPage } from "../../pageobject/Asset/AssetPage";
import { v4 as uuidv4 } from "uuid";

describe("Asset", () => {
  const assetPage = new AssetPage();
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
});
