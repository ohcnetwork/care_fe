import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { FacilityDevices } from "@/pageObject/facility/FacilityDevices";
import { FacilityHomepage } from "@/pageObject/facility/FacilityHomepage";

describe("Facility Devices", () => {
  const facilityCreation = new FacilityCreation();
  const facilityHomepage = new FacilityHomepage();
  const facilityDevices = new FacilityDevices();

  beforeEach(() => {
    cy.loginByApi("nurse");
    cy.visit("/");
  });

  it("Create a new device with mandatory fields and edit the details", () => {
    facilityCreation.selectFacility("GHC payyanur");
    facilityHomepage.navigateToSettings();
    facilityDevices.navigateToDevices().clickAddDeviceButton();
  });

  it("Assign a new location to the devices and verify location history", () => {
    facilityCreation.selectFacility("GHC payyanur");
  });
});
