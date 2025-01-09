import { FacilityCreation } from "../../pageObject/facility/FacilityCreation";
import { generatePhoneNumber } from "../../utils/commonUtils";
import { generateFacilityData } from "../../utils/facilityData";

describe("Facility Management", () => {
  const facilityPage = new FacilityCreation();
  const facilityType = "Primary Health Centre";
  const testFacility = generateFacilityData();
  const phoneNumber = generatePhoneNumber();

  beforeEach(() => {
    cy.visit("/login");
    cy.loginByApi("nurse");
  });

  it("Create a new facility using the admin role", () => {
    facilityPage.navigateToOrganization("Kerala");
    facilityPage.navigateToFacilitiesList();
    facilityPage.clickAddFacility();

    // Fill form
    facilityPage.fillBasicDetails(
      testFacility.name,
      facilityType,
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
    facilityPage.navigateToOrganization("Kerala");
    facilityPage.navigateToFacilitiesList();
    facilityPage.clickAddFacility();
    facilityPage.submitFacilityCreationForm();
    facilityPage.verifyValidationErrors();
  });
});
