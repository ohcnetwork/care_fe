import { AssetSearchPage } from "../../pageobject/Asset/AssetSearch";
import { AssetQRScanPage } from "../../pageobject/Asset/AssetQRScan";
import { AssetPagination } from "../../pageobject/Asset/AssetPagination";
import { AssetFilters } from "../../pageobject/Asset/AssetFilters";
import { AssetPage } from "../../pageobject/Asset/AssetCreation";
import LoginPage from "../../pageobject/Login/LoginPage";
import { v4 as uuidv4 } from "uuid";

describe("Asset Tab", () => {
  const assetSearchPage = new AssetSearchPage();
  const assetQRScanPage = new AssetQRScanPage();
  const assetPagination = new AssetPagination();
  const assetFilters = new AssetFilters();
  const assetPage = new AssetPage();
  const loginPage = new LoginPage();
  const assetName = "Dummy Camera 10";
  const qrCode = uuidv4();
  const serialNumber = Math.floor(Math.random() * 10 ** 10).toString();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/assets");
  });

  // search for a element

  it("Search Asset Name/QR_ID/Serial_number", () => {
    assetSearchPage.typeSearchKeyword(assetName);
    assetSearchPage.pressEnter();
    assetSearchPage.verifyBadgeContent(assetName);
    assetSearchPage.clickAssetByName(assetName);
    assetSearchPage.clickUpdateButton();
    assetSearchPage.clearAndTypeQRCode(qrCode);
    assetSearchPage.clearAndTypeSerialNumber(serialNumber);
    assetSearchPage.clickAssetSubmitButton();
    assetSearchPage.visitAssetsPage();
    assetSearchPage.typeSearchKeyword(qrCode);
    assetSearchPage.pressEnter();
    assetSearchPage.verifyAssetListContains(assetName);
    assetSearchPage.verifyBadgeContent(qrCode);
    assetSearchPage.typeSearchKeyword(serialNumber);
    assetSearchPage.verifyAssetListContains(assetName);
    assetSearchPage.verifyBadgeContent(serialNumber);
  });

  // scan a asset qr code

  it("Scan Asset QR", () => {
    assetQRScanPage.scanAssetQR();
  });

  // filter the asset and verify the badges are there

  it("Filter Asset", () => {
    assetFilters.filterAssets(
      "Dummy Facility 40",
      "ACTIVE",
      "ONVIF Camera",
      "Camera Loc",
    );
    assetFilters.clickadvancefilter();
    assetFilters.clickslideoverbackbutton(); // to verify the back button doesn't clear applied filters
    assetFilters.assertFacilityText("Dummy Facility 40");
    assetFilters.assertAssetClassText("ONVIF");
    assetFilters.assertStatusText("ACTIVE");
    assetFilters.assertLocationText("Camera Loc");
    assetFilters.clickadvancefilter();
    assetFilters.clearFilters();
  });

  // Verify the pagination in the page

  it("Next/Previous Page", () => {
    assetPagination.navigateToNextPage();
    assetPagination.navigateToPreviousPage();
  });

  it("Import new asset", () => {
    assetPage.selectassetimportbutton();
    assetPage.selectImportOption();
    assetPage.selectImportFacility("Dummy Facility 40");
    assetPage.importAssetFile();
    assetPage.selectImportLocation("Camera Loc");
    assetPage.clickImportAsset();
  });

  it("verify imported asset", () => {
    assetSearchPage.typeSearchKeyword("New Test Asset");
    assetSearchPage.pressEnter();
    assetSearchPage.verifyAssetIsPresent("New Test Asset");
  });

  it("Export asset", () => {
    assetPage.selectassetimportbutton();
    cy.wait(2000);
    assetPage.selectjsonexportbutton();
    assetPage.selectassetimportbutton();
    assetPage.selectcsvexportbutton();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
