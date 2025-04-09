import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { FacilityDevices } from "@/pageObject/facility/FacilityDevices";
import { generateDeviceName } from "@/utils/commonUtils";
import { viewPort } from "@/utils/viewPort";

describe("Facility Devices Management", () => {
  const facilityCreation = new FacilityCreation();
  const facilityDevices = new FacilityDevices();

  beforeEach(() => {
    cy.viewport(viewPort.laptopStandard.width, viewPort.laptopStandard.height);
    cy.loginByApi("devdevices");
    cy.visit("/");
  });

  it("Create a new device and verify modification and delete it", () => {
    const deviceName = generateDeviceName();
    const newDeviceName = generateDeviceName();
    facilityCreation.selectFacility("GHC Payyanur");
    facilityDevices
      .navigateToFacilitySettings()
      .navigateToFacilityDevices()
      .clickAddDevice()
      .fillDeviceForm({
        registeredName: deviceName,
      })
      .submitDeviceForm()
      .assertDeviceCreationSuccess()
      .searchDeviceList(deviceName)
      .clickDevice(deviceName)
      .assertDeviceDetails(deviceName)
      .clickDeviceEditButton()
      .fillDeviceForm({
        registeredName: newDeviceName,
        availabilityStatus: "Lost",
        status: "Inactive",
      })
      .submitDeviceForm()
      .assertDeviceUpdateSuccess()
      .assertDeviceDetails(newDeviceName)
      .clickDeviceDeleteButton();
  });
});
