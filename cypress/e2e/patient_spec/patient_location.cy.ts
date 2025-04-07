import { PatientLocation } from "@/pageObject/Patients/PatientLocation";
import { LocationData } from "@/pageObject/Patients/PatientLocation";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
const patientLocation = new PatientLocation();

describe("Manage locations association to an encounter", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("devdoctor3");
    cy.visit("/");
    facilityCreation.selectFacility("GHC Payyanur");
  });

  // it("Manage a bed association to an encounter", () => {
  //   patientEncounter
  //     .navigateToEncounters()
  //     .clickInProgressEncounterFilter()
  //     .openFirstEncounterDetails();

  //   // Associate New Location to the first planned encounter
  //   patientLocation
  //     .clickAddLocationBadge()
  //     .selectLocationBuilding("Block C")
  //     .clickShowAvailableBeds()
  //     .selectLocationBed("ICU")
  //     .clickAssignBedButton()
  //     .clickSaveBedButton()
  //     .assertLocationAssociationSuccess()

  //     // mark current location as completed
  //     .clickAssociatedLocationBadge()
  //     .clickUpdateLocationButton()
  //     .clickCompleteBedStayButton()
  //     .clickCompleteBedButton()
  //     .assertLocationCompletedSuccess();
  // });

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
        bedsCount: "2 Beds",
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

      // Open Existing Location created by a super admin
      .searchLocation("Block B")
      .openFirstExistingLocation()

      // Create Room Location with Room data and verify and delete it
      .clickChildAddLocation()
      .fillLocationData(roomData)
      .interceptLocationCreationRequest()
      .submitLocationForm()
      .verifyLocationCreationAPICall()
      .assertLocationCreationSuccess()
      .searchChildLocation(roomData.name)
      .interceptLocationDeletionAPICall()
      .clickFirstDeleteLocationButton()
      .assertLocationDeletionSuccess()
      .verifyLocationDeletionAPICall()

      // Create House Location with House data
      .clickChildAddLocation()
      .fillLocationData(houseData)
      .interceptLocationCreationRequest()
      .submitLocationForm()
      .verifyLocationCreationAPICall()
      .assertLocationCreationSuccess()
      .searchChildLocation(houseData.name)
      .interceptLocationDeletionAPICall()
      .clickFirstDeleteLocationButton()
      .assertLocationDeletionSuccess()
      .verifyLocationDeletionAPICall()

      // Create Multiple Bed Locations with Beds data
      .clickChildAddLocation()
      .fillLocationData(bedData)
      .interceptLocationCreationRequest()
      .submitLocationForm()
      .verifyLocationCreationAPICall()
      .assertMultipleBedsCreationSuccess(bedData.bedsCount)
      .searchChildLocation(bedData.name)
      .interceptLocationDeletionAPICall()
      .clickFirstDeleteLocationButton()
      .assertLocationDeletionSuccess()
      .verifyLocationDeletionAPICall();
  });
});
