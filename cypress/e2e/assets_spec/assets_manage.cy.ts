import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import { AssetPage } from "../../pageobject/Asset/AssetCreation";
import LoginPage from "../../pageobject/Login/LoginPage";

describe("Asset", () => {
  const assetPage = new AssetPage();
  const loginPage = new LoginPage();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/assets");
  });

  it("Delete an Asset", () => {
    assetPage.openCreatedAsset();
    assetPage.interceptDeleteAssetApi();
    assetPage.deleteAsset();
    assetPage.verifyDeleteStatus();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
