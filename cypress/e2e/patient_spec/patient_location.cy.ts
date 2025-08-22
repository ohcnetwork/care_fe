import {
  LocationData,
  PatientLocation,
} from "@/pageObject/Patients/PatientLocation";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
const patientLocation = new PatientLocation();

describe("Manage locations association to an encounter", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("superadmin");
    cy.visit("/");
    facilityCreation.selectFirstRandomFacility();
  });

  it("should create and delete a room location", () => {
    const roomData: LocationData = {
      name: "Room 1",
    };

    patientLocation
      .navigateToSettings()
      .clickLocationTab()
      .openFirstExistingLocation()
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
      .openFirstExistingLocation()
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
      .openFirstExistingLocation()
      .clickChildAddLocation()
      .fillLocationData(bedData)
      .submitLocationForm()
      .assertMultipleBedsCreationSuccess(bedData.bedsCount)
      .interceptLocationDeletionAPICall()
      .searchChildLocation(bedData.name + " 1")
      .clickFirstDeleteLocationButton()
      .verifyLocationDeletionAPICall()
      .searchChildLocation(bedData.name + " 2")
      .clickFirstDeleteLocationButton()
      .assertLocationDeletionSuccess();
  });
});
