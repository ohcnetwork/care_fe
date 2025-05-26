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

  it("Assign Department/Team to an Encounter and verify it", () => {
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails();
    patientDepartments.clickAddOrganization();

    cy.get('[data-cy="link-organisation-name"]').then(($el) => {
      const departmentName = $el.text().trim();

      patientDepartments
        .interceptDeleteOrganization()
        .deleteOrganization()
        .verifyDeleteOrganizationSuccess()
        .selectAllOrganizationsTab()
        .selectOrganization(departmentName)
        .clickAddOrganizationToEncounterSubmit()
        .verifyOrganizationAdded();
    });
  });

  it("Add a new department and create a sub-child, and now verify both are visible in the sidebar nav", () => {
    const departmentName = generateDeptName();
    const subDepartmentName = generateDeptName("Sub-");
    const description = generateRandomCharacter({
      charLimit: 50,
    });
    const OrganizationType = "Department";

    // Create a new department in the facility
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
      .assertCreationSuccess();
    // Create a sub-department in the facility
    patientDepartments
      .searchDepartmentTeam(departmentName)
      .openDepartmentsTeamFirstRandomDetails()
      .clickAddDepartmentTeam()
      .enterName(subDepartmentName)
      .selectType(OrganizationType)
      .enterDescription(description)
      .interceptCreateRequest()
      .clickCreateOrganization()
      .verifyCreateRequest()
      .assertCreationSuccess()
      .verifyParentDepartmentAndClick(departmentName);
  });

  it("Navigate to the facility's administration department and link a user to the facility", () => {
    const userName = "care-nurse";
    const role = "Volunteer";
    const updatedRole = "Doctor";
    const departmentName = "Administration";

    // Navigate to the facility's administration department and link a user to the facility
    patientDepartments
      .navigateToSettings()
      .navigateToDepartments()
      .searchDepartmentTeam(departmentName)
      .openDepartmentsTeamFirstRandomDetails()
      .clickUsersTab()
      .clickLinkUser()
      .selectAssignedUser(userName)
      .selectRoleOfUser(role)
      .interceptAssignUserRequest()
      .clickAddUserToOrganization()
      .verifyAssignUserRequest()
      .assertUserAddedSuccess();
    // Update the new added user role to doctor
    patientDepartments
      .searchUser(userName)
      .verifyUserRole(role)
      .clickEditRole()
      .selectRoleOfUserInEdit(updatedRole)
      .interceptUpdateRoleRequest()
      .clickUpdateUserRole()
      .verifyUpdateRoleRequest()
      .verifyUserRole(updatedRole)
      // Remove the user from the facility
      .clickEditRole()
      .interceptRemoveUserRequest()
      .clickRemoveUser()
      .clickConfirmRemove()
      .verifyRemoveUserRequest()
      .assertUserRemovalSuccess();
  });
});
