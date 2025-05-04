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

  it("Create a new department/team and a sub-department/team, then verify that the search functionality works correctly on the dashboard", () => {
    const subDepartmentName = generateDeptName("Sub-");
    const description = generateRandomCharacter({
      charLimit: 50,
    });
    const OrganizationType = "Department";
    const updatedOrganizationType = "Team";
    const updatedDescription = generateRandomCharacter({
      charLimit: 50,
    });
    const updatedDepartmentTeamName = generateDeptName("Updated-Sub-");
    patientDepartments
      .navigateToSettings()
      .navigateToDepartments()
      .clickAddDepartmentTeam()
      .enterName(departmentName)
      .selectType(OrganizationType)
      .enterDescription(description)
      .interceptCreateRequest()
      .clickCreateOrganization()
      .verifyCreateRequest()
      .assertCreationSuccess()
      .searchDepartmentTeam(departmentName)
      .openDepartmentsTeamDetails()
      .clickAddDepartmentTeam()
      .enterName(subDepartmentName)
      .selectType(OrganizationType)
      .enterDescription(description)
      .interceptCreateRequest()
      .clickCreateOrganization()
      .verifyCreateRequest()
      .assertCreationSuccess()
      .searchDepartmentTeam(subDepartmentName)
      .verifyDepartmentTeamContentInList(subDepartmentName, OrganizationType)
      .clickEditOrganization()
      .enterName(updatedDepartmentTeamName)
      .selectType(updatedOrganizationType)
      .enterDescription(updatedDescription)
      .interceptUpdateRequest()
      .clickUpdateOrganization()
      .verifyUpdateRequest()
      .assertUpdateSuccess()
      .searchDepartmentTeam(updatedDepartmentTeamName)
      .verifyDepartmentTeamContentInList(
        updatedDepartmentTeamName,
        updatedOrganizationType,
      );
  });

  it("Navigate to the facility's administration department and link a user to the facility", () => {
    const userName = "devnurse3";
    const role = "Nurse";
    const departmentName = "Administration";

    patientDepartments
      .navigateToSettings()
      .navigateToDepartments()
      .searchDepartmentTeam(departmentName)
      .openDepartmentsTeamDetails()
      .clickUsersTab()
      .clickLinkUser()
      .selectAssignedUser(userName)
      .selectRoleOfUser(role)
      .clickAddUserToOrganization()
      .assertUserAddedSuccess()
      .searchUser(userName)
      .clickEditRole()
      .clickRemoveUser()
      .clickConfirmRemove()
      .assertUserRemovalSuccess();
  });

  it("Assign Department/Team to an Encounter and verify it", () => {
    const linkDeptName = "Test Dept (DON'T DELETE IT)";

    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails();
    patientDepartments
      .clickAddOrganization()
      .selectAllOrganizationsTab()
      .selectOrganization(linkDeptName)
      .clickAddOrganizationToEncounterSubmit()
      .verifyOrganizationAdded(linkDeptName);
  });
});
