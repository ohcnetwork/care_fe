import { PatientLocation } from "@/pageObject/Patients/PatientLocation";
import { LocationData } from "@/pageObject/Patients/PatientLocation";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
const patientLocation = new PatientLocation();

describe("Manage locations association to an encounter", () => {
  const PARENT_LOCATION = "Block B";

  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("devdoctor3");
    cy.visit("/");
    facilityCreation.selectFacility("GHC Payyanur");
  });

  it("should create and delete a room location", () => {
    const roomData: LocationData = {
      name: "Room 1",
    };

    patientLocation
      .navigateToSettings()
      .clickLocationTab()
      .searchLocation(PARENT_LOCATION)
      .openFirstExistingLocation(PARENT_LOCATION)
      .clickChildAddLocation()
      .fillLocationData(roomData)
      .interceptLocationCreationRequest()
      .submitLocationForm()
      .verifyLocationCreationAPICall()
      .assertLocationCreationSuccess()
      .searchChildLocation(roomData.name)
      .interceptLocationDeletionAPICall()
      .clickFirstDeleteLocationButton()
      .verifyLocationDeletionAPICall();
  });

  it("should create and delete a house location", () => {
    const houseData: LocationData = {
      form: "House",
      name: "House 1",
      description: "House description",
      status: "Inactive",
      opStatus: "Housekeeping",
    };

    patientLocation
      .navigateToSettings()
      .clickLocationTab()
      .searchLocation(PARENT_LOCATION)
      .openFirstExistingLocation(PARENT_LOCATION)
      .clickChildAddLocation()
      .fillLocationData(houseData)
      .interceptLocationCreationRequest()
      .submitLocationForm()
      .assertLocationCreationSuccess()
      .verifyLocationCreationAPICall()
      .searchChildLocation(houseData.name)
      .interceptLocationDeletionAPICall()
      .clickFirstDeleteLocationButton()
      .verifyLocationDeletionAPICall();
  });

  it("should create and delete multiple bed locations", () => {
    const bedData: LocationData = {
      form: "Bed",
      name: "ICU",
      bedsCount: "2 Beds",
      description: "Location 1 description",
      status: "Active",
      opStatus: "Operational",
    };

    patientLocation
      .navigateToSettings()
      .clickLocationTab()
      .searchLocation(PARENT_LOCATION)
      .openFirstExistingLocation(PARENT_LOCATION)
      .clickChildAddLocation()
      .fillLocationData(bedData)
      .submitLocationForm()
      .assertMultipleBedsCreationSuccess(bedData.bedsCount)
      .interceptLocationDeletionAPICall()
      .searchChildLocation(bedData.name)
      .clickFirstDeleteLocationButton()
      .verifyLocationDeletionAPICall()
      .searchChildLocation(bedData.name)
      .clickFirstDeleteLocationButton()
      .assertLocationDeletionSuccess();
  });
});
