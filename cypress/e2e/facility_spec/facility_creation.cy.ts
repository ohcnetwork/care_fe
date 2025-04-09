import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { generatePhoneNumber } from "@/utils/commonUtils";
import { generateFacilityData } from "@/utils/facilityData";
import { viewPort } from "@/utils/viewPort";

const LOCATION_HIERARCHY = {
  state: "Kerala",
  district: "Ernakulam",
  localBody: "Aluva",
  ward: "4",
};

describe("Facility Management", () => {
  const facilityPage = new FacilityCreation();
  const facilityType = "Primary Health Centre";

  beforeEach(() => {
    cy.viewport(viewPort.laptopStandard.width, viewPort.laptopStandard.height);
    cy.loginByApi("nurse");
    cy.visit("/");
  });

  it("Create a new facility using the admin role and verify validation errors", () => {
    const testFacility = generateFacilityData();
    const phoneNumber = generatePhoneNumber();

    facilityPage.navigateToGovernance("Kerala");
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

    // Test incomplete location hierarchy combinations
    // 1. Only state
    facilityPage.submitFacilityCreationForm();

    // 2. State and district only
    facilityPage.fillLocationHierarchy({
      district: LOCATION_HIERARCHY.district,
    });
    facilityPage.submitFacilityCreationForm();
    // 3. State, district and local body only
    facilityPage.fillLocationHierarchy({
      localBody: LOCATION_HIERARCHY.localBody,
    });
    facilityPage.submitFacilityCreationForm();

    // Fill complete location hierarchy
    facilityPage.fillLocationHierarchy({
      ward: LOCATION_HIERARCHY.ward,
    });
    facilityPage.fillLocationDetails("Ernakulam");

    // Submit and verify
    facilityPage.makePublicFacility();
    facilityPage.submitFacilityCreationForm();
    facilityPage.verifySuccessMessage();

    // Wait for facility cards to load
    facilityPage.waitForFacilityCardsToLoad();

    // Search for the facility and verify in card
    facilityPage.searchFacility(testFacility.name);
    facilityPage.verifyFacilityNameInCard(testFacility.name);
  });
});
