import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { generatePhoneNumber } from "@/utils/commonUtils";
import { generateFacilityData } from "@/utils/facilityData";
import { viewPort } from "@/utils/viewPort";

describe("Facility Management", () => {
  const facilityPage = new FacilityCreation();
  const facilityType = "Primary Health Centre";

  beforeEach(() => {
    cy.viewport(viewPort.desktop2k.width, viewPort.desktop2k.height);
    cy.loginByApi("administrator");
    cy.visit("/");
  });

  it("Create a new facility using the admin role and verify validation errors", () => {
    const testFacility = generateFacilityData();
    const phoneNumber = generatePhoneNumber();

    facilityPage.navigateToGovernance("Government");
    facilityPage.navigateToFacilitiesList();
    facilityPage.clickAddFacility();
    facilityPage.submitFacilityCreationForm();
    facilityPage.verifyValidationErrors();

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

    facilityPage.fillLocationDetails("Ernakulam");

    // Submit and verify
    facilityPage.makePublicFacility();
    facilityPage.interceptFacilityCreation();
    facilityPage.submitFacilityCreationForm();
    facilityPage.verifyFacilityCreation();

    // Wait for facility cards to load
    facilityPage.waitForFacilityCardsToLoad();

    // Search for the facility and verify in card
    facilityPage.searchFacility(testFacility.name);
    facilityPage.verifyFacilityNameInCard(testFacility.name);
  });
});
