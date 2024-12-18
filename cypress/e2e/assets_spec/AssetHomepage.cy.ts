import { advanceFilters } from "pageobject/utils/advanceFilterHelpers";
import { pageNavigation } from "pageobject/utils/paginationHelpers";
import { v4 as uuidv4 } from "uuid";

import { AssetFilters } from "../../pageobject/Asset/AssetFilters";
import { AssetHome } from "../../pageobject/Asset/AssetHome";
import LoginPage from "../../pageobject/Login/LoginPage";
import { nonAdminRoles } from "../../pageobject/utils/userConfig";

const rolesToTest: Array<"districtAdmin" | (typeof nonAdminRoles)[number]> = [
  "districtAdmin",
  ...nonAdminRoles,
];

rolesToTest.forEach((role) => {
  describe(`Asset Tab Tests for Role: ${role}`, () => {
    const assetHome = new AssetHome();
    const assetFilters = new AssetFilters();
    const loginPage = new LoginPage();
    const assetName = "Dummy Camera 10";
    const assetStatus = "ACTIVE";
    const assetClass = "ONVIF";
    const assetLocation = "Camera Loc";
    const facilityName = "Dummy Facility 40";
    const newImportAssetName = "New Test Asset";
    const qrCode = uuidv4();
    const serialNumber = Math.floor(Math.random() * 10 ** 10).toString();

    before(() => {
      loginPage.loginByRole(role);
      cy.saveLocalStorage();
    });

    beforeEach(() => {
      cy.restoreLocalStorage();
      cy.clearLocalStorage(/filters--.+/);
      cy.awaitUrl("/assets");
    });

    it("Search Asset Name/QR_ID/Serial_number", () => {
      assetHome.typeAssetSearch(assetName);
      advanceFilters.verifyFilterBadgePresence(
        "Name/Serial No./QR ID",
        assetName,
        true,
      );
      assetHome.clickAssetByName(assetName);
      assetHome.clickAssetDetailsUpdateButton();
      assetHome.clearAndTypeQRCode(qrCode);
      assetHome.clearAndTypeSerialNumber(serialNumber);
      assetHome.clickAssetUpdateSubmitButton();
      assetHome.navigateToAssetsPage();
      assetHome.typeAssetSearch(qrCode);
      assetHome.verifyAssetListContains(assetName);
      advanceFilters.verifyFilterBadgePresence(
        "Name/Serial No./QR ID",
        qrCode,
        true,
      );
      assetHome.typeAssetSearch(serialNumber);
      assetHome.verifyAssetListContains(assetName);
      advanceFilters.verifyFilterBadgePresence(
        "Name/Serial No./QR ID",
        serialNumber,
        true,
      );
    });

    it("Scan Asset QR", () => {
      assetHome.scanAssetQR();
    });

    it("Advance Filter Asset", () => {
      advanceFilters.clickAdvancedFiltersButton();
      advanceFilters.typeFacilityName(facilityName);
      assetFilters.filterAssets(assetStatus, assetClass, assetLocation);
      advanceFilters.applySelectedFilter();
      advanceFilters.clickAdvancedFiltersButton();
      advanceFilters.clickslideoverbackbutton(); // to verify the back button doesn't clear applied filters
      advanceFilters.verifyFilterBadgePresence("Facility", facilityName, true);
      advanceFilters.verifyFilterBadgePresence("Asset Class", assetClass, true);
      advanceFilters.verifyFilterBadgePresence("Status", assetStatus, true);
      advanceFilters.verifyFilterBadgePresence("Location", assetLocation, true);
      advanceFilters.clickAdvancedFiltersButton();
      advanceFilters.clickClearAdvanceFilters();
    });

    it("Next/Previous Page", () => {
      pageNavigation.navigateToNextPage();
      pageNavigation.verifyCurrentPageNumber(2);
      pageNavigation.navigateToPreviousPage();
      pageNavigation.verifyCurrentPageNumber(1);
    });

    it("Import new asset and verify its presence", () => {
      if (role === "districtAdmin") {
        assetHome.selectAssetImportButton("click");
        assetHome.selectImportOption();
        assetHome.selectImportFacility(facilityName);
        assetHome.importAssetFile();
        assetHome.selectImportLocation(assetLocation);
        assetHome.clickImportAsset();
        cy.verifyNotification("Assets imported successfully");
        cy.closeNotification();
        assetHome.navigateToAssetsPage();
        assetHome.typeAssetSearch(newImportAssetName);
        assetHome.verifyAssetIsPresent(newImportAssetName);
      } else {
        assetHome.selectAssetImportButton("verifyNotExist");
      }
    });

    it("Export the list of assets in CSV & Json", () => {
      if (role === "districtAdmin") {
        assetHome.selectAssetImportButton("click");
        assetHome.selectJsonExportButton();
        assetHome.selectAssetImportButton("click");
        assetHome.selectCsvExportButton();
      } else {
        assetHome.selectAssetImportButton("verifyNotExist");
      }
    });

    afterEach(() => {
      cy.saveLocalStorage();
    });
  });
});
