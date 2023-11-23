import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import LoginPage from "../../pageobject/Login/LoginPage";

describe("Inventory Management Section", () => {
  const facilityPage = new FacilityPage();
  const loginPage = new LoginPage();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/");
    cy.viewport(1280, 720);
  });

  it("Adds Inventory", () => {
    facilityPage.visitAlreadyCreatedFacility();
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickInventoryManagementOption();
    facilityPage.clickManageInventory();
    facilityPage.fillInventoryDetails("Liquid Oxygen", "Add Stock", "120");
    facilityPage.clickAddInventory();
    facilityPage.verifySuccessNotification("Inventory created successfully");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
