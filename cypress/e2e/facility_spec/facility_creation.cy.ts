import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { generatePhoneNumber } from "@/utils/commonUtils";
import { generateFacilityData } from "@/utils/facilityData";
import { viewPort } from "@/utils/viewPort";

const FACILITY_TYPES = [
  "Primary Health Centres",
  "Family Health Centres",
  "Community Health Centres",
  "Women and Child Health Centres",
  "Taluk Hospitals",
  "District Hospitals",
  "Govt Medical College Hospitals",
  "Govt Labs",
  "Private Labs",
  "TeleMedicine",
  "Private Hospital",
  "Autonomous healthcare facility",
  "Shifting Centre",
  "Request Approving Center",
  "Request Fulfilment Center",
  "Other",
  "Clinical Non Governmental Organization",
  "Non Clinical Non Governmental Organization",
  "Community Based Organization",
];

describe("Facility Management", () => {
  const facilityPage = new FacilityCreation();

  beforeEach(() => {
    cy.viewport(viewPort.desktop2k.width, viewPort.desktop2k.height);
    cy.loginByApi("administrator");
    cy.visit("/");
  });

  // Test validation errors first
  it("Verify validation errors when submitting empty facility form", () => {
    facilityPage.navigateToGovernance("Government");
    facilityPage.navigateToFacilitiesList();
    facilityPage.clickAddFacility();
    facilityPage.submitFacilityCreationForm();
    facilityPage.verifyValidationErrors();
  });

  // Test facility creation for each facility type
  FACILITY_TYPES.forEach((facilityType) => {
    it(`Create a new ${facilityType} facility and verify creation`, () => {
      const testFacility = generateFacilityData();
      const phoneNumber = generatePhoneNumber();

      facilityPage.navigateToGovernance("Government");
      facilityPage.navigateToFacilitiesList();
      facilityPage.clickAddFacility();

      // Fill form
      facilityPage
        .fillBasicDetails(
          testFacility.name,
          facilityType,
          testFacility.description,
        )
        .selectFeatures(testFacility.features)
        .fillContactDetails(
          phoneNumber,
          testFacility.pincode,
          testFacility.address,
        )
        .fillLocationDetails("Ernakulam")
        .makePublicFacility()
        .interceptFacilityCreation()
        .submitFacilityCreationForm()
        .verifyFacilityCreation()
        .waitForFacilityCardsToLoad()
        .searchFacility(testFacility.name)
        .verifyFacilityNameInCard(testFacility.name)
        .verifyFacilityDetails(
          testFacility.name,
          facilityType,
          testFacility.address,
        );
    });
  });
});
