import { PatientLocation } from "@/pageObject/Patients/PatientLocation";
import { LocationData } from "@/pageObject/Patients/PatientLocation";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
const patientLocation = new PatientLocation();

describe("Add a new Location and associate to an Encounter", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("raj");
    cy.visit("/");
    facilityCreation.selectFacility("MEDICAL FACILITY");
  });

  it("Create a new Location", () => {
    const formData: Array<LocationData> = [
      {
        form: "Room",
        name: "Location 1",
        description: "Location 1 description",
        status: "Active",
      },
      {
        form: "House",
        name: "House 1",
        description: "House description",
        status: "Inactive",
        opStatus: "Housekeeping",
      },
      {
        form: "Bed",
        name: "ICU",
        bedsCount: "5 Beds",
        description: "Location 1 description",
        status: "Active",
        opStatus: "Operational",
      },
    ];

    const roomData = formData[0];
    const houseData = formData[1];
    const bedData = formData[2];

    patientLocation
      .navigateToSettings()
      .clickLocationTab()

      // Create Room Location
      .clickAddLocation()
      .fillLocationData(roomData)
      .interceptLocationCreationRequest()
      .submitLocationForm()
      .verifyLocationCreationAPICall()
      .assertLocationCreationSuccess()

      // Create House Location
      .clickAddLocation()
      .fillLocationData(houseData)
      .interceptLocationCreationRequest()
      .submitLocationForm()
      .verifyLocationCreationAPICall()
      .assertLocationCreationSuccess()

      // Create Multiple Bed Locations
      .clickAddLocation()
      .fillLocationData(bedData)
      .interceptLocationCreationRequest()
      .submitLocationForm()
      .verifyLocationCreationAPICall()
      .assertMultipleBedsCreationSuccess(bedData.bedsCount);
  });

  it("Dissociate existing Location from encounter and associate new location", () => {});
});
