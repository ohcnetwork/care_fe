import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import FacilityHome from "../../pageobject/Facility/FacilityHome";
import LoginPage from "../../pageobject/Login/LoginPage";

describe("Inventory Management Section", () => {
  const facilityPage = new FacilityPage();
  const loginPage = new LoginPage();
  const facilityHome = new FacilityHome();
  const inventoryName = "PPE";

  before(() => {
    loginPage.loginByRole("districtAdmin");
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
    cy.intercept("GET", "/api/v1/items/**").as("getItems");
    facilityPage.clickManageInventory();
    cy.wait("@getItems").its("response.statusCode").should("eq", 200);
    facilityPage.fillInventoryDetails("PPE", "Add Stock", "10");
    facilityPage.clickAddInventory();
    facilityPage.verifySuccessNotification("Inventory created successfully");
    cy.closeNotification();
    facilityPage.clickManageInventory();
    // modify the new item
    facilityPage.fillInventoryDetails("PPE", "Use Stock", "5");
    facilityPage.clickAddInventory();
    facilityPage.verifySuccessNotification(
      "Inventory use stock updated successfully",
    );
    // verify the new modification
    facilityPage.verifyPpeQuantity("PPE");
    facilityPage.verifyPpeQuantity("5");
    // delete the last Entry
    facilityPage.clickPpeQuantity();
    facilityPage.clickLastEntry();
    // verify the last entry deletion
    facilityPage.verifyStockInRow("#row-0", "Added Stock");
    facilityPage.verifyStockInRow("#row-1", "Used Stock");
    facilityHome.navigateBack();
    facilityPage.verifyPpeQuantity("PPE");
  });

  it("Add New Inventory | Verify Backend and manual Minimum", () => {
    // Add Inventory
    facilityPage.clickManageInventory();
    facilityPage.fillInventoryDetails(inventoryName, "Add Stock", "5");
    facilityPage.clickAddInventory();
    facilityPage.verifySuccessNotification("Inventory created successfully");
    cy.closeNotification();
    // Verify Backend minimum badge
    facilityPage.verifyBadgeWithText(".badge-danger", "Low Stock");
    cy.intercept("GET", "**/api/v1/facility/*/min_quantity/**").as(
      "getMinQuantity",
    );
    // modify with manual minimum badge
    facilityPage.clickAddMinimumQuanitity();
    cy.wait("@getMinQuantity").its("response.statusCode").should("eq", 200);
    cy.get("body").then(($body) => {
      if ($body.find("#update-minimum-quantity").is(":visible")) {
        // If the 'update-minimum-quantity' element is visible, click it
        facilityPage.clickUpdateMinimumQuantity();
        facilityPage.setQuantity("5");
        facilityPage.clickSaveUpdateMinimumQuantity();
      } else {
        // Otherwise, click the 'set-minimum-quantity' element
        facilityPage.clickSetMinimumQuantity();
        facilityPage.fillInventoryMinimumDetails(inventoryName, "1");
        facilityPage.clickSetButton();
        facilityPage.verifySuccessNotification(
          "Minimum quantiy updated successfully",
        );
      }
    });
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
