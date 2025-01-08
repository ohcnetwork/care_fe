import { LoginPage } from "../../pageObject/auth/LoginPage";
import { FacilityCreation } from "../../pageObject/facility/FacilityCreation";
import { generatePhoneNumber } from "../../utils/commonUtils";
import { generateFacilityData } from "../../utils/facilityData";

describe("Facility Management", () => {
  const loginPage = new LoginPage();
  const facilityPage = new FacilityCreation();
  const testFacility = generateFacilityData();
  const phoneNumber = generatePhoneNumber();

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.saveLocalStorage();
    cy.visit("/login");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });

  it("Create a new facility using the admin role", () => {
    // Login
    loginPage.loginByRole("admin");
    // Navigate to facility creation
    facilityPage.navigateToFacilities();
    facilityPage.clickAddFacility();

    // Fill form
    facilityPage.fillBasicDetails(
      testFacility.name,
      testFacility.type,
      testFacility.description,
    );

    facilityPage.selectFeatures(testFacility.features);

    facilityPage.fillContactDetails(
      phoneNumber,
      testFacility.pincode,
      testFacility.address,
    );

    facilityPage.fillLocationDetails(
      testFacility.coordinates.latitude,
      testFacility.coordinates.longitude,
    );

    // Submit and verify
    facilityPage.makePublicFacility();
    facilityPage.submitFacilityCreationForm();
    facilityPage.verifySuccessMessage();

    // Search for the facility and verify in card
    facilityPage.searchFacility(testFacility.name);
    facilityPage.verifyFacilityNameInCard(testFacility.name);
  });

  it("Should show validation errors for required fields", () => {
    loginPage.loginByRole("nurse");

    facilityPage.navigateToFacilities();
    facilityPage.clickAddFacility();
    facilityPage.submitFacilityCreationForm();
    facilityPage.verifyValidationErrors();
  });
});
