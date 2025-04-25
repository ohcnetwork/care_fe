import { PatientDetails } from "@/pageObject/Patients/PatientDetails";
import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { generateName } from "@/utils/commonUtils";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const patientDetails = new PatientDetails();

describe("Patient Management", () => {
  beforeEach(() => {
    cy.viewport(viewPort.laptopStandard.width, viewPort.laptopStandard.height);
    cy.loginByApi("devdoctor");
    cy.visit("/");
  });

  it("Assign users to a patient", () => {
    const userName = "nihal";
    const userRole = "Nurse";
    const patientName = generateName();
    facilityCreation.selectFacility("GHC Payyanur");
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .searchEncounter(patientName)
      .openFirstEncounterDetails()
      .clickPatientDetailsButton();
    patientDetails
      .clickUsersTab()
      .clickAssignUserButton()
      .selectUserToAssign(userName)
      .selectUserRole(userRole)
      .confirmUserAssignment()
      .verifyUserAssignmentSuccess()
      .verifyUserContent([userName])
      .clickRemoveUserButton()
      .confirmUserRemoval()
      .verifyUserRemovalSuccess();
  });
});
