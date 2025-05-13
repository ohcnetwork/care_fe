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
    cy.loginByApi("facility_admin");
    cy.visit("/");
    facilityCreation.selectFirstRandomFacility();
  });

  it("Add a new department and create a sub-child, and now verify both are visible in the sidebar nav", () => {
    const departmentName = generateDeptName();
    const subDepartmentName = generateDeptName("Sub-");
    const description = generateRandomCharacter({
      charLimit: 50,
    });
    const OrganizationType = "Department";
    // const updatedOrganizationType = "Team";
    // const updatedDescription = generateRandomCharacter({
    //   charLimit: 50,
    // });
    // const updatedDepartmentTeamName = generateDeptName("Updated-Sub-");
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
      .verifyParentDepartmentAndClick(departmentName)
      .verifyChildDepartment(subDepartmentName);
  });

  it("Navigate to the facility's administration department and link a user to the facility", () => {
    const userName = "nurse_2_0";
    const role = "Nurse";
    const updatedRole = "Doctor";
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
      .interceptAssignUserRequest()
      .clickAddUserToOrganization()
      .verifyAssignUserRequest()
      .assertUserAddedSuccess()
      .searchUser(userName)
      .verifyUserRole(role)
      .clickEditRole()
      .selectRoleOfUserInEdit(updatedRole)
      .interceptUpdateRoleRequest()
      .clickUpdateUserRole()
      .verifyUpdateRoleRequest()
      .verifyUserRole(updatedRole)
      .clickEditRole()
      .interceptRemoveUserRequest()
      .clickRemoveUser()
      .clickConfirmRemove()
      .verifyRemoveUserRequest()
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
      .selectOrganization()
      .clickAddOrganizationToEncounterSubmit();
  });
});
