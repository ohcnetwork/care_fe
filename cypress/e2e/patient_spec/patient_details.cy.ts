import { PatientDetails } from "@/pageObject/Patients/PatientDetails";
import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const patientDetails = new PatientDetails();

describe("Patient Management", () => {
  beforeEach(() => {
    cy.loginByApi("devdoctor");
    cy.visit("/");
  });

  it("Assign users to a patient", () => {
    const userName = "nihal-nurse";
    const userRole = "Nurse";
    facilityCreation.selectFacility("GHC Trikaripur");
    patientEncounter
      .navigateToEncounters()
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
