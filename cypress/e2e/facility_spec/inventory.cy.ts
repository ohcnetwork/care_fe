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
    facilityPage.visitAlreadyCreatedFacility();
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickInventoryManagementOption();
  });

  it("Add New Inventory | Modify data and delete last entry ", () => {
    // add a new item
    facilityPage.clickManageInventory();
    facilityPage.fillInventoryDetails("PPE", "Add Stock", "10");
    facilityPage.clickAddInventory();
    facilityPage.verifySuccessNotification("Inventory created successfully");
    facilityPage.clickManageInventory();
    // modify the new item
    facilityPage.fillInventoryDetails("PPE", "Use Stock", "5");
    facilityPage.clickAddInventory();
    facilityPage.verifySuccessNotification("Inventory created successfully");
    // verify the new modification
    cy.get("#PPE").contains("PPE").should("be.visible");
    cy.get("#PPE").contains("5").should("be.visible");
    // delete the last Entry
    cy.get("#PPE").click();
    cy.get("#delete-last-entry").click();
    // verify the last entry deletion
    cy.get("#row-0").contains("Added Stock").should("be.visible");
    cy.get("#row-1").contains("Used Stock").should("be.visible");
    cy.wait(3000);
    cy.go(-1);
    cy.get("#PPE").contains("PPE").should("be.visible");
  });

  it("Add New Inventory | Verify Backend and manual Minimum", () => {
    // Add Inventory
    facilityPage.clickManageInventory();
    facilityPage.fillInventoryDetails("PPE", "Add Stock", "5");
    facilityPage.clickAddInventory();
    facilityPage.verifySuccessNotification("Inventory created successfully");
    // Verify Backend minimum badge
    cy.get(".badge-danger").contains("Low Stock").should("exist");
    // modify with manual minimum badge
    cy.get("#add-minimum-quantity").click();
    cy.wait(3000);
    cy.get("body").then(($body) => {
      if ($body.find("#update-minimum-quantity").is(":visible")) {
        // If the 'update-minimum-quantity' element is visible, click it
        cy.get("#update-minimum-quantity").first().click();
        cy.get("#quantity").click().clear().click().type("5");
        cy.get("#save-update-minimumquanitity").click();
      } else {
        // Otherwise, click the 'set-minimum-quantity' element
        cy.get("#set-minimum-quantity").click();
        facilityPage.fillInventoryMinimumDetails("PPE", "1");
        facilityPage.clickSetButton();
      }
    });
    cy.go(-1);
    cy.wait(3000);
    cy.get("#set-minimum-quantity").should("not.be.visible");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
