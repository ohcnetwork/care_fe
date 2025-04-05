import { PatientLocation } from "@/pageObject/Patients/PatientLocation";
import { LocationData } from "@/pageObject/Patients/PatientLocation";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
const patientLocation = new PatientLocation();

describe("Add a new Location and associate to an Encounter", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("devdoctor3");
    cy.visit("/");
    facilityCreation.selectFacility("GHC Payyanur");
  });

  it("Create a new Location", () => {
    const formData: Array<LocationData> = [
      // Room location form data with just required field eg. name
      {
        name: "Room 1",
      },

      // House location form data with all fields
      {
        form: "House",
        name: "House 1",
        description: "House description",
        status: "Inactive",
        opStatus: "Housekeeping",
      },

      // Bulk beds creation
      {
        form: "Bed",
        name: "ICU",
        bedsCount: "5 Beds",
        description: "Location 1 description",
        status: "Active",
        opStatus: "Operational",
      },
    ];

    // Set up form data for each type of location
    const roomData = formData[0];
    const houseData = formData[1];
    const bedData = formData[2];

    patientLocation
      .navigateToSettings()
      .clickLocationTab()

      // Create Room Location with Room data
      .clickAddLocation()
      .fillLocationData(roomData)
      .interceptLocationCreationRequest()
      .submitLocationForm()
      .verifyLocationCreationAPICall()
      .assertLocationCreationSuccess()

      // Create House Location with House data
      .clickAddLocation()
      .fillLocationData(houseData)
      .interceptLocationCreationRequest()
      .submitLocationForm()
      .verifyLocationCreationAPICall()
      .assertLocationCreationSuccess()

      // Create Multiple Bed Locations with Beds data
      .clickAddLocation()
      .fillLocationData(bedData)
      .interceptLocationCreationRequest()
      .submitLocationForm()
      .verifyLocationCreationAPICall()
      .assertMultipleBedsCreationSuccess(bedData.bedsCount);
  });

  it("Dissociate existing Location from encounter and associate new location", () => {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    const endTime = now.toISOString().slice(0, 16);
    patientLocation
      .navigateToEncounters()
      .clickPlannedEncounterFilter()
      .openFirstEncounterDetails()

      // Associate New Location to the first planned encounter
      .clickAddLocationBadge()
      .searchBedLocation("ICU 5")
      .interceptLocationCreationRequest()
      .submitLocationAssociation()
      .assertLocationAssociationSuccess()

      // Dissociate Current Location assuming a location is already associated
      .clickAssociatedLocationBadge()
      .clickUpdateLocationButton()
      .searchBedLocation("ICU 5")
      .interceptLocationCreationRequest()

      // Associate new location without dissociating current location and verify error
      .submitLocationAssociation()
      .verifyLocationAssociationFailAPICall()

      // Dissociate Current Location and associate new location
      .setStatusCompleted()
      .fillEndTime(endTime)
      .interceptLocationUpdationRequest()
      .clickSaveStatusButton()
      .assertLocationStatusUpdateSuccess();
  });
});
