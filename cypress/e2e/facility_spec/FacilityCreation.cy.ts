import {
  generateFacilityName,
  generatePhoneNumber,
  generateRandomAddress,
} from "pageobject/utils/constants";

import FacilityPage, {
  FacilityData,
} from "../../pageobject/Facility/FacilityCreation";
import LoginPage from "../../pageobject/Login/LoginPage";
import { nonAdminRoles } from "../../pageobject/utils/userConfig";

describe("Facility Creation with multiple user roles", () => {
  const facilityPage = new FacilityPage();
  const loginPage = new LoginPage();
  const facilityName = generateFacilityName();
  const facilityNumber = generatePhoneNumber();
  const facilityAddress = generateRandomAddress(false);
  const facilityUpdatedNumber = generatePhoneNumber();
  const facilityUpdatedName = generateFacilityName();
  const facilityUpdatedAddress = generateRandomAddress(true);
  const facilityFeatures = [
    "CT Scan",
    "X-Ray",
    "Maternity Care",
    "Neonatal Care",
    "Operation Theater",
    "Blood Bank",
  ];
  const facilityErrorMessage = [
    "Required",
    "Required",
    "Invalid Pincode",
    "Required",
    "Required",
    "Required",
    "Required",
    "Required",
    "Required",
    "Invalid Phone Number",
  ];
  const facilityType = "Primary Health Centres";
  const testFacilityData: FacilityData = {
    basic: {
      name: facilityName,
      type: facilityType,
      address: facilityAddress,
      phoneNumber: facilityNumber,
      location: "Kochi, Kerala",
    },
    location: {
      pincode: "682001",
      state: "Kerala",
      district: "Ernakulam",
      localBody: "Aluva",
      ward: "4",
    },
  };

  before(() => {
    loginPage.loginByRole("districtAdmin");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.restoreLocalStorage();
  });

  it("Create a new facility with all fields | Edit Existing Data | Verify its reflection", () => {
    // Create a new facility
    facilityPage.visitCreateFacilityPage();
    facilityPage.fillBasicDetails({
      ...testFacilityData.basic,
      features: facilityFeatures,
    });
    facilityPage.fillLocationDetails(testFacilityData.location);
    facilityPage.selectLocation("Kochi, Kerala");
    facilityPage.clickSaveFacilityButton();
    facilityPage.verifyFacilityCreatedNotification();
    // verify the facility card info
    cy.verifyContentPresence("#facility-details-card", [
      facilityName,
      facilityAddress,
      facilityNumber,
    ]);
    // Edit the facility data
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickUpdateFacilityOption();
    facilityPage.typeFacilityName(facilityUpdatedName, true);
    facilityPage.typeFacilityPhoneNumber(facilityUpdatedNumber, true);
    facilityPage.typeFacilityAddress(facilityUpdatedAddress, true);
    facilityPage.clickUpdateFacilityButton();
    facilityPage.verifyFacilityUpdatedNotification();
    // verify the facility card updated info
    cy.verifyContentPresence("#facility-details-card", [
      facilityUpdatedName,
      facilityUpdatedAddress,
      facilityUpdatedNumber,
    ]);
  });

  it("Create a new facility with only mandatory fields | Delete the facility", () => {
    // Create a new facility
    facilityPage.visitCreateFacilityPage();
    facilityPage.fillBasicDetails(testFacilityData.basic);
    facilityPage.fillLocationDetails(testFacilityData.location);
    facilityPage.clickSaveFacilityButton();
    facilityPage.verifyFacilityCreatedNotification();
    // verify the facility card info
    cy.verifyContentPresence("#facility-details-card", [
      facilityName,
      facilityAddress,
      facilityNumber,
    ]);
    // verify the delete facility functionality
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickDeleteFacilityOption();
    facilityPage.confirmDeleteFacility();
    cy.verifyNotification(`${facilityName} deleted successfully`);
  });

  it("Should display error when district admin tries to create facility in a different district", () => {
    // Verify the entire form error message
    facilityPage.visitCreateFacilityPage();
    facilityPage.clickSaveFacilityButton();
    cy.verifyErrorMessages(facilityErrorMessage);
    // Verify the user access based error message
    facilityPage.fillBasicDetails(testFacilityData.basic);
    facilityPage.fillPincode("682001");
    facilityPage.selectStateOnPincode("Kerala");
    facilityPage.selectDistrictOnPincode("Kottayam");
    facilityPage.selectLocalBody("Arpookara");
    facilityPage.selectWard("5");
    facilityPage.clickSaveFacilityButton();
    facilityPage.verifyErrorNotification(
      "You do not have permission to perform this action.",
    );
  });

  it("Access Restriction for Non-Admin Users to facility creation page", () => {
    nonAdminRoles.forEach((role) => {
      loginPage.loginByRole(role);
      cy.visit("/facility/create");
      facilityPage.verifyErrorNotification(
        "You don't have permission to perform this action. Contact the admin",
      );
      cy.clearCookies();
    });
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
