import { PatientDetails } from "@/pageObject/Patients/PatientDetails";
import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const patientDetails = new PatientDetails();

describe("Patient Management", () => {
  beforeEach(() => {
    cy.viewport(viewPort.laptopStandard.width, viewPort.laptopStandard.height);
    cy.loginByApi("doctor");
    cy.visit("/");
  });

  it("Assign users to a patient", () => {
    const userName = "Admin User";
    const userRole = "Nurse";
    facilityCreation.selectFirstRandomFacility();
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
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
