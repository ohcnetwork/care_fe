import { PatientDepartments } from "@/pageObject/Patients/PatientDepartments";
import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { generateDeptName, generateRandomCharacter } from "@/utils/commonUtils";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
const patientDepartments = new PatientDepartments();
const patientEncounter = new PatientEncounter();

describe("Manage departments/teams association to an encounter", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("devdepartment");
    cy.visit("/");
    facilityCreation.selectFacility("GHC Payyanur");
  });

  const departmentName = generateDeptName();

  it("Create a new department and a sub-department, then verify that the search functionality works correctly on the dashboard", () => {
    const subDepartmentName = generateDeptName("Sub-");
    const description = generateRandomCharacter({
      charLimit: 50,
    });
    patientDepartments
      .navigateToSettings()
      .navigateToDevicesTab()
      .clickAddDepartment()
      .enterName(departmentName)
      .selectType("Department")
      .enterDescription(description)
      .interceptCreateRequest()
      .clickCreateOrganization()
      .verifyCreateRequest()
      .assertCreationSuccess()
      .searchDepartment(departmentName)
      .openDepartmentsDetails()
      .clickAddDepartment()
      .enterName(subDepartmentName)
      .selectType("Department")
      .enterDescription(description)
      .interceptCreateRequest()
      .clickCreateOrganization()
      .verifyCreateRequest()
      .assertCreationSuccess()
      .searchDepartment(subDepartmentName)
      .verifyDepartmentInList(subDepartmentName);
  });

  it("Navigate to the facility's administration department and link a user to the facility", () => {
    patientDepartments
      .navigateToSettings()
      .navigateToDevicesTab()
      .searchDepartment("Administration")
      .openDepartmentsDetails()
      .clickUsersTab()
      .clickLinkUser()
      .selectAssignedUser("devnurse3")
      .selectRoleOfUser("Nurse")
      .clickAddUserToOrganization()
      .assertUserAddedSuccess()
      .searchUser("devnurse3")
      .clickEditRole()
      .clickRemoveUser()
      .clickConfirmRemove()
      .assertUserRemovalSuccess();
  });

  it("Assign Department/Team to an Encounter and verify it", () => {
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails();
    patientDepartments
      .clickAddOrganization()
      .selectAllOrganizationsTab()
      .selectOrganization(departmentName)
      .clickAddOrganizationToEncounterSubmit()
      .verifyOrganizationAdded(departmentName);
  });
});
