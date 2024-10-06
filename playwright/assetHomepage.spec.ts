import { test } from "@playwright/test";
import { AssetSearchPage } from "../playwright/pageobjects/AssetSearchPage";
import { v4 as uuidv4 } from "uuid";

test.describe("Asset Tab - Search Asset", () => {
  let assetSearchPage: AssetSearchPage;
  const assetName = "Dummy Camera 10";
  const qrCode = uuidv4();
  const serialNumber = Math.floor(Math.random() * 10 ** 10).toString();

  test.beforeEach(async ({ page }) => {
    assetSearchPage = new AssetSearchPage(page);

    // Session state is already loaded, so no need for login
    await page.goto("http://localhost:4000/assets"); // Update the URL to your app's login page
    // Step 2: Fill in the login form
    await page.fill("#username", "devdistrictadmin"); // Update the selector and username
    await page.fill("#password", "Coronasafe@123"); // Update the selector and password
    // Step 3: Click the login button
    await page.click('button:text("Login")');
  });

  test("Search Asset Name/QR_ID/Serial_number", async () => {
    // Search by Asset Name
    await assetSearchPage.typeSearchKeyword(assetName);
    await assetSearchPage.pressEnter();
    await assetSearchPage.clickAssetByName(assetName);
    await assetSearchPage.clickUpdateButton();

    // Update with new QR code and Serial Number
    await assetSearchPage.clearAndTypeQRCode(qrCode);
    await assetSearchPage.clearAndTypeSerialNumber(serialNumber);
    await assetSearchPage.clickAssetSubmitButton();

    // Search by QR code
    await assetSearchPage.visitAssetsPage();
    await assetSearchPage.typeSearchKeyword(qrCode);
    await assetSearchPage.pressEnter();

    // Search by Serial Number
    await assetSearchPage.typeSearchKeyword(serialNumber);
  });
});
