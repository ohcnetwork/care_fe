import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { FacilityHomepage } from "@/pageObject/facility/FacilityHomepage";

describe("Facility Devices", () => {
  const facilityCreation = new FacilityCreation();
  const facilityHomepage = new FacilityHomepage();

  beforeEach(() => {
    cy.loginByApi("nurse");
    cy.visit("/");
  });

  it("Create a new device and edit the details", () => {
    facilityCreation.selectFacility("GHC payyanur");
    facilityHomepage.navigateToSettings();
  });

  it("Assign a new location to the devices and verify location history", () => {
    facilityCreation.selectFacility("GHC payyanur");
  });
});
