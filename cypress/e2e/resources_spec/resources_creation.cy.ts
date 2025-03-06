import { PatientDetails } from "@/pageObject/Patients/PatientDetails";
import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { ResourcesCreation } from "@/pageObject/resources/ResourcesCreation";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const patientDetails = new PatientDetails();
const resourceCreation = new ResourcesCreation();

describe("Resources Management", () => {
  beforeEach(() => {
    cy.loginByApi("devnurse");
    cy.visit("/");
  });

  it("Create a new resource", () => {
    facilityCreation.selectFacility("GHC payyanur");
    patientEncounter
      .navigateToEncounters()
      .openFirstEncounterDetails()
      .clickPatientDetailsButton();

    patientDetails.clickResourcesTab().clickCreateRequestButton();

    resourceCreation
      .selectFacility("DH Aluva")
      .selectStatus("Pending")
      .selectCategory("Medicines")
      .selectAssignedUser("Sam Hospital")
      .enterResourceTitle("TestCypress")
      .enterReasonOfRequest("Reason Testing")
      .clickFillMyDetails()
      .clickSubmitButton()
      .assertResourceCreateSuccess();
  });
});
