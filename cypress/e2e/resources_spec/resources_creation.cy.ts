import { PatientDetails } from "@/pageObject/Patients/PatientDetails";
import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const patientDetails = new PatientDetails();

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
  });
});
