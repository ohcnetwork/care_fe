import LoginPage from "../../pageobject/Login/LoginPage";
import ManageUserPage from "../../pageobject/Users/ManageUserPage";
import { UserCreationPage } from "../../pageobject/Users/UserCreation";
import { UserPage } from "../../pageobject/Users/UserSearch";

describe("Manage User", () => {
  const loginPage = new LoginPage();
  const userPage = new UserPage();
  const manageUserPage = new ManageUserPage();
  const usernameToLinkFacilitydoc1 = "dummydoctor4";
  const usernameToLinkFacilitydoc2 = "dummydoctor5";
  const usernameToLinkFacilitydoc3 = "dummydoctor6";
  const usernameToLinkSkill = "devdoctor";
  const firstNameUserSkill = "Dev";
  const lastNameUserSkill = "Doctor";
  const userCreationPage = new UserCreationPage();
  const usernameforworkinghour = "devdistrictadmin";
  const usernamerealname = "Dummy Doctor";
  const facilitytolinkusername = "Dummy Shifting Center";
  const facilitytolinkskill = "Dummy Facility 40";
  const workinghour = "23";
  const linkedskill = "Immunologist";

  before(() => {
    loginPage.loginAsDistrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/users");
  });

  it("linking skills for users and verify its reflection in profile", () => {
    // select the district user and select one skill link and verify its profile reflection
    userPage.typeInSearchInput(usernameforworkinghour);
    userPage.checkUsernameText(usernameforworkinghour);
    manageUserPage.clickMoreDetailsButton(usernameforworkinghour);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickLinkedSkillTab();
    cy.wait(500);
    manageUserPage.verifyLinkedSkillsTabPage();
    manageUserPage.selectSkillFromDropdown(linkedskill);
    manageUserPage.clickAddSkillButton();
    cy.wait(500);
    manageUserPage.assertSkillInAddedUserSkills(linkedskill);
    cy.wait(500);
    manageUserPage.navigateToProfile();
    userCreationPage.verifyElementContainsText(
      "username-profile-details",
      usernameforworkinghour,
    );
    manageUserPage.assertSkillInAlreadyLinkedSkills(linkedskill);
    // unlink the skill
    manageUserPage.navigateToManageUser();
    userPage.typeInSearchInput(usernameforworkinghour);
    userPage.checkUsernameText(usernameforworkinghour);
    manageUserPage.clickMoreDetailsButton(usernameforworkinghour);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickLinkedSkillTab();
    manageUserPage.assertSkillInAddedUserSkills(linkedskill);
    manageUserPage.clickUnlinkSkill();
    manageUserPage.verifyUnlinkSkillModal();
    manageUserPage.clickConfirmUnlinkSkill();
  });

  it("linking skills for a doctor users and verify its reflection in doctor connect", () => {
    // select a doctor user and link and unlink same skill twice and verify the badge is only shown once in doctor connect
    userPage.clickAdvancedFilters();
    userPage.typeInFirstName(firstNameUserSkill);
    userPage.typeInLastName(lastNameUserSkill);
    userPage.applyFilter();
    userPage.checkUsernameText(usernameToLinkSkill);
    manageUserPage.clickMoreDetailsButton(usernameToLinkSkill);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickLinkedSkillTab();
    manageUserPage.verifyDoctorQualification();
    manageUserPage.verifyLinkedSkillsTabPage();
    manageUserPage.selectSkillFromDropdown(linkedskill);
    manageUserPage.clickAddSkillButton();
    cy.wait(500); // temporary hack to fix the failure
    manageUserPage.assertSkillInAddedUserSkills(linkedskill);
    manageUserPage.clickUnlinkSkill();
    manageUserPage.verifyUnlinkSkillModal();
    manageUserPage.clickConfirmUnlinkSkill();
    manageUserPage.selectSkillFromDropdown(linkedskill);
    manageUserPage.clickAddSkillButton();
    // verifying the doctor connect
    manageUserPage.navigateToFacility();
    manageUserPage.typeFacilitySearch(facilitytolinkskill);
    manageUserPage.assertFacilityInCard(facilitytolinkskill);
    manageUserPage.clickFacilityPatients();
    manageUserPage.clickDoctorConnectButton();
    manageUserPage.assertSkillIndoctorconnect(linkedskill);
  });

  it("add working hour for a user and verify its reflection in card and user profile", () => {
    // verify mandatory field error and select working hour for a user
    userPage.typeInSearchInput(usernameforworkinghour);
    userPage.checkUsernameText(usernameforworkinghour);
    manageUserPage.clickMoreDetailsButton(usernameforworkinghour);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.verifyProfileTabPage();
    manageUserPage.clearweeklyhourfield();
    manageUserPage.clickSubmit();
    manageUserPage.verifyErrorText(
      "Average weekly working hours must be a number between 0 and 168",
    );
    manageUserPage.typeInWeeklyWorkingHours(workinghour);
    manageUserPage.clickSubmit();
    // verify the data is reflected in user card and profile page
    manageUserPage.verifyWorkingHours(workinghour);
    manageUserPage.navigateToProfile();
    manageUserPage.verifyProfileWorkingHours(workinghour);
  });

  it("linking and unlinking facility for multiple users, and confirm reflection in user cards and doctor connect", () => {
    // verify the user doesn't have any home facility
    userPage.typeInSearchInput(usernameToLinkFacilitydoc1);
    userPage.checkUsernameText(usernameToLinkFacilitydoc1);
    manageUserPage.assertHomeFacility("No home facility");
    manageUserPage.clickMoreDetailsButton(usernameToLinkFacilitydoc1);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickLinkedFacilitiesTab();
    manageUserPage.verifyLinkedFacilitiesTabPage();
    //  Link a new facility and ensure it is under linked facility - doctor username (1)
    manageUserPage.selectFacilityFromDropdown(facilitytolinkusername);
    manageUserPage.clickLinkFacility();
    manageUserPage.assertLinkedFacility(facilitytolinkusername);
    //  Verify in the already linked facility are not present in droplist
    manageUserPage.assertFacilityNotInDropdown(facilitytolinkusername);
    // Go back to manage user page
    manageUserPage.navigateToManageUser();
    //  Link a new facility and ensure it is under home facility - doctor username (2)
    userPage.typeInSearchInput(usernameToLinkFacilitydoc2);
    userPage.checkUsernameText(usernameToLinkFacilitydoc2);
    manageUserPage.clickMoreDetailsButton(usernameToLinkFacilitydoc2);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickLinkedFacilitiesTab();
    manageUserPage.verifyLinkedFacilitiesTabPage();
    manageUserPage.selectFacilityFromDropdown(facilitytolinkusername);
    manageUserPage.clickLinkFacility();
    manageUserPage.clickLinkedFacilitySettings();
    manageUserPage.clickSetHomeFacility();
    manageUserPage.assertnotLinkedFacility(facilitytolinkusername);
    manageUserPage.assertHomeFacilitylink(facilitytolinkusername);
    //  verify the home facility doctor id have reflection in user card
    manageUserPage.navigateToManageUser();
    userPage.typeInSearchInput(usernameToLinkFacilitydoc2);
    userPage.checkUsernameText(usernameToLinkFacilitydoc2);
    manageUserPage.assertHomeFacility(facilitytolinkusername);
    // Link a new facility and unlink the facility from the doctor username (3)
    manageUserPage.navigateToManageUser();
    userPage.typeInSearchInput(usernameToLinkFacilitydoc3);
    userPage.checkUsernameText(usernameToLinkFacilitydoc3);
    manageUserPage.clickMoreDetailsButton(usernameToLinkFacilitydoc3);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickLinkedFacilitiesTab();
    manageUserPage.verifyLinkedFacilitiesTabPage();
    manageUserPage.selectFacilityFromDropdown(facilitytolinkusername);
    manageUserPage.clickLinkFacility();
    manageUserPage.clickLinkedFacilitySettings();
    manageUserPage.clickUnlinkFacilityButton();
    manageUserPage.clickSubmit();
    manageUserPage.linkedfacilitylistnotvisible();
    //  Go to particular facility doctor connect and all user-id are reflected based on there access
    // Path will be facility page to patient page then doctor connect button
    manageUserPage.navigateToFacility();
    manageUserPage.typeFacilitySearch(facilitytolinkusername);
    manageUserPage.assertFacilityInCard(facilitytolinkusername);
    manageUserPage.clickFacilityPatients();
    manageUserPage.clickDoctorConnectButton();
    manageUserPage.assertDoctorConnectVisibility(usernamerealname);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
