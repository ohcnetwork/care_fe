import { advanceFilters } from "pageobject/utils/advanceFilterHelpers";

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
  const linkedskill = "General Medicine";

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
    manageUserPage.clicklinkedskillbutton();
    manageUserPage.selectSkillFromDropdown(linkedskill);
    manageUserPage.clickAddSkillButton();
    manageUserPage.clickCloseSlideOver();
    cy.wait(5000);
    manageUserPage.clicklinkedskillbutton();
    manageUserPage.assertSkillInAddedUserSkills(linkedskill);
    manageUserPage.clickCloseSlideOver();
    cy.wait(5000);
    manageUserPage.navigateToProfile();
    userCreationPage.verifyElementContainsText(
      "username-profile-details",
      usernameforworkinghour,
    );
    manageUserPage.assertSkillInAlreadyLinkedSkills(linkedskill);
  });

  it("linking skills for a doctor users and verify its reflection in doctor connect", () => {
    // select a doctor user and link and unlink same skill twice and verify the badge is only shown once in doctor connect
    advanceFilters.clickAdvancedFiltersButton();
    userPage.typeInFirstName(firstNameUserSkill);
    userPage.typeInLastName(lastNameUserSkill);
    userPage.selectHomeFacility(facilitytolinkskill);
    advanceFilters.applySelectedFilter();
    userPage.checkUsernameText(usernameToLinkSkill);
    manageUserPage.clicklinkedskillbutton();
    manageUserPage.selectSkillFromDropdown(linkedskill);
    manageUserPage.clickAddSkillButton();
    cy.verifyNotification("Skill added successfully");
    cy.closeNotification();
    manageUserPage.assertSkillInAddedUserSkills(linkedskill);
    manageUserPage.clickCloseSlideOver();
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
    manageUserPage.clicksetaveragehourbutton();
    manageUserPage.clearweeklyhourfield();
    manageUserPage.clickSubmit();
    manageUserPage.verifyErrorText("Value should be between 0 and 168");
    // verify the data is reflected in user card and profile page
    manageUserPage.typeInWeeklyWorkingHours(workinghour);
    manageUserPage.clickSubmit();
    manageUserPage.verifyWorkingHours(workinghour);
    manageUserPage.navigateToProfile();
    manageUserPage.verifyProfileWorkingHours(workinghour);
  });

  it("linking and unlinking facility for multiple users, and confirm reflection in user cards and doctor connect", () => {
    // verify the user doesn't have any home facility
    userPage.typeInSearchInput(usernameToLinkFacilitydoc1);
    userPage.checkUsernameText(usernameToLinkFacilitydoc1);
    manageUserPage.assertHomeFacility("No Home Facility");
    //  Link a new facility and ensure it is under linked facility - doctor username (1)
    manageUserPage.clickFacilitiesTab();
    manageUserPage.selectFacilityFromDropdown(facilitytolinkusername);
    manageUserPage.clickLinkFacility();
    manageUserPage.assertLinkedFacility(facilitytolinkusername);
    //  Verify in the already linked facility are not present in droplist
    manageUserPage.assertFacilityNotInDropdown(facilitytolinkusername);
    manageUserPage.clickCloseSlideOver();
    //  Link a new facility and ensure it is under home facility - doctor username (2)
    userPage.clearSearchInput();
    userPage.typeInSearchInput(usernameToLinkFacilitydoc2);
    userPage.checkUsernameText(usernameToLinkFacilitydoc2);
    manageUserPage.clickFacilitiesTab();
    manageUserPage.selectFacilityFromDropdown(facilitytolinkusername);
    manageUserPage.clickLinkFacility();
    manageUserPage.clickHomeFacilityIcon();
    manageUserPage.assertnotLinkedFacility(facilitytolinkusername);
    manageUserPage.assertHomeFacilitylink(facilitytolinkusername);
    manageUserPage.clickCloseSlideOver();
    //  verify the home facility doctor id have reflection in user card
    userPage.clearSearchInput();
    userPage.typeInSearchInput(usernameToLinkFacilitydoc2);
    userPage.checkUsernameText(usernameToLinkFacilitydoc2);
    manageUserPage.assertHomeFacility(facilitytolinkusername);
    // Link a new facility and unlink the facility from the doctor username (3)
    userPage.clearSearchInput();
    userPage.typeInSearchInput(usernameToLinkFacilitydoc3);
    userPage.checkUsernameText(usernameToLinkFacilitydoc3);
    manageUserPage.clickFacilitiesTab();
    manageUserPage.selectFacilityFromDropdown(facilitytolinkusername);
    manageUserPage.clickLinkFacility();
    manageUserPage.clickUnlinkFacilityButton();
    manageUserPage.clickSubmit();
    manageUserPage.linkedfacilitylistnotvisible();
    manageUserPage.clickCloseSlideOver();
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
