import * as dayjs from "dayjs";
import FacilityHome from "pageobject/Facility/FacilityHome";
import { advanceFilters } from "pageobject/utils/advanceFilterHelpers";

import LoginPage from "../../pageobject/Login/LoginPage";
import ManageUserPage from "../../pageobject/Users/ManageUserPage";
import { UserPage } from "../../pageobject/Users/UserSearch";

describe("Manage User", () => {
  const loginPage = new LoginPage();
  const userPage = new UserPage();
  const manageUserPage = new ManageUserPage();
  const facilityHome = new FacilityHome();
  const usernameToLinkFacilitydoc1 = "dummydoctor4";
  const usernameToLinkFacilitydoc2 = "dummydoctor5";
  const usernameToLinkFacilitydoc3 = "dummydoctor6";
  const usernameToLinkSkill = "devdoctor";
  const firstNameUserSkill = "Dev";
  const lastNameUserSkill = "Doctor";
  const usernameforworkinghour = "devdistrictadmin";
  const nurseUsername = "dummynurse1";
  const doctorUsername = "devdoctor";
  const doctorToDelete = "dummydoctor12";
  const usernamerealname = "Dummy Doctor";
  const facilitytolinkusername = "Dummy Shifting Center";
  const facilitytolinkskill = "Dummy Facility 40";
  const workinghour = "23";
  const linkedskill = "Immunologist";

  before(() => {
    loginPage.loginByRole("districtAdmin");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.viewport(1280, 720);
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/users");
  });

  // To Do: Add avatar upload
  /* it("District Admin can change their own avatar", () => {
    userPage.typeInSearchInput(nurseUsername);
    userPage.checkUsernameText(nurseUsername);
    manageUserPage.clickMoreDetailsButton(nurseUsername);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.verifyChangeAvatarButtonVisible();
    manageUserPage.clickChangeAvatarButton();
  }); */

  it("edit a nurse user's basic information and verify its reflection", () => {
    userPage.typeInSearchInput(nurseUsername);
    userPage.checkUsernameText(nurseUsername);
    manageUserPage.clickMoreDetailsButton(nurseUsername);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickBasicInfoViewButton();
    manageUserPage.clickBasicInfoEditButton();
    manageUserPage.clearUserBasicInfo();
    manageUserPage.clickSubmit();
    manageUserPage.verifyErrorText("First Name is required");
    manageUserPage.verifyErrorText("Last Name is required");
    manageUserPage.editUserBasicInfo("Devo", "Districto", "11081999", "Female");
    manageUserPage.clickSubmit();
    manageUserPage.clickBasicInfoViewButton();
    manageUserPage.verifyEditUserDetails(
      "Devo",
      "Districto",
      "8/11/1999",
      "Female",
    );
  });

  it("edit a nurse user's contact information and verify its reflection", () => {
    userPage.typeInSearchInput(nurseUsername);
    userPage.checkUsernameText(nurseUsername);
    manageUserPage.clickMoreDetailsButton(nurseUsername);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickContactInfoViewButton();
    manageUserPage.clickContactInfoEditButton();
    manageUserPage.clearUserContactInfo();
    manageUserPage.clickSubmit();
    manageUserPage.verifyErrorText("Please enter a valid email address");
    manageUserPage.verifyErrorText("Please enter valid phone number");
    manageUserPage.editUserContactInfo("dev@gmail.com", "6234343435");
    manageUserPage.clickSubmit();
    manageUserPage.clickContactInfoViewButton();
    manageUserPage.verifyEditUserContactInfo("dev@gmail.com", "6234343435");
  });

  it("edit a nurse user's professional information and verify its reflection", () => {
    userPage.typeInSearchInput(nurseUsername);
    userPage.checkUsernameText(nurseUsername);
    manageUserPage.clickMoreDetailsButton(nurseUsername);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickProfessionalInfoViewButton();
    // Should have qualification field
    // Should not have years of experience and medical council registration fields
    manageUserPage.verifyQualificationExist();
    manageUserPage.verifyYoeAndCouncilRegistrationDoesntExist();
    manageUserPage.clickProfessionalInfoEditButton();
    manageUserPage.clearDoctorOrNurseProfessionalInfo(false);
    manageUserPage.clickSubmit();
    manageUserPage.verifyErrorText("Qualification is required");
    manageUserPage.editUserProfessionalInfo("Msc");
    manageUserPage.clickSubmit();
    manageUserPage.clickProfessionalInfoViewButton();
    manageUserPage.verifyEditUserProfessionalInfo("Msc");
  });

  it("edit a doctor user's professional information and verify its reflection", () => {
    // Should have qualification, years of experience and medical council registration
    userPage.typeInSearchInput(usernameToLinkFacilitydoc1);
    userPage.checkUsernameText(usernameToLinkFacilitydoc1);
    manageUserPage.clickMoreDetailsButton(usernameToLinkFacilitydoc1);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickProfessionalInfoViewButton();
    manageUserPage.verifyQualificationExist();
    manageUserPage.verifyYoeAndCouncilRegistrationExist();
    manageUserPage.clickProfessionalInfoEditButton();
    manageUserPage.clearDoctorOrNurseProfessionalInfo(true);
    manageUserPage.clickSubmit();
    manageUserPage.verifyErrorText("Qualification is required");
    manageUserPage.verifyErrorText("Years of experience is required");
    manageUserPage.verifyErrorText("Medical Council Registration is required");
    manageUserPage.editUserProfessionalInfo("Msc", "120", "1234567890");
    manageUserPage.clickSubmit();
    manageUserPage.verifyErrorText(
      "Please enter a valid number between 0 and 100.",
    );
    manageUserPage.clearDoctorOrNurseProfessionalInfo(true);
    manageUserPage.editUserProfessionalInfo("Msc", "10", "1234567890");
    manageUserPage.clickSubmit();
    manageUserPage.clickProfessionalInfoViewButton();
    const experienceCommencedOn = dayjs().subtract(10, "year");
    const formattedDate = dayjs(experienceCommencedOn).format("YYYY-MM-DD");
    manageUserPage.verifyEditUserProfessionalInfo(
      "Msc",
      formattedDate,
      "1234567890",
    );
  });

  it("Nurse user doesn't have edit options or password change option (for other users)", () => {
    loginPage.ensureLoggedIn();
    loginPage.clickSignOutBtn();
    loginPage.loginManuallyAsNurse();
    loginPage.ensureLoggedIn();
    cy.visit("/users");
    userPage.typeInSearchInput(doctorUsername);
    userPage.checkUsernameText(doctorUsername);
    manageUserPage.clickMoreDetailsButton(doctorUsername);
    manageUserPage.verifyMoreDetailsPage(false);
    manageUserPage.verifyUsername(doctorUsername);
    manageUserPage.verifyBasicInfoEditButtonNotExist();
    manageUserPage.verifyContactInfoEditButtonNotExist();
    manageUserPage.verifyProfessionalInfoEditButtonNotExist();
    manageUserPage.verifyPasswordEditButtonNotExist();
    loginPage.ensureLoggedIn();
    loginPage.clickSignOutBtn();
    loginPage.loginManuallyAsDistrictAdmin();
    loginPage.ensureLoggedIn();
  });

  it("Nurse user doesn't have delete option for other users", () => {
    loginPage.ensureLoggedIn();
    loginPage.clickSignOutBtn();
    loginPage.loginManuallyAsNurse();
    loginPage.ensureLoggedIn();
    cy.visit("/users");
    userPage.typeInSearchInput(doctorUsername);
    userPage.checkUsernameText(doctorUsername);
    manageUserPage.clickMoreDetailsButton(doctorUsername);
    manageUserPage.verifyMoreDetailsPage(false);
    manageUserPage.verifyDeleteButtonNotExist();
    loginPage.ensureLoggedIn();
    loginPage.clickSignOutBtn();
    loginPage.loginManuallyAsDistrictAdmin();
    loginPage.ensureLoggedIn();
  });

  it("Nurse user can change their own password", () => {
    loginPage.ensureLoggedIn();
    loginPage.clickSignOutBtn();
    loginPage.loginManuallyAsNurse();
    loginPage.ensureLoggedIn();
    cy.visit("/users");
    userPage.typeInSearchInput(nurseUsername);
    userPage.checkUsernameText(nurseUsername);
    manageUserPage.clickMoreDetailsButton(nurseUsername);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickPasswordEditButton();
    manageUserPage.changePassword("Coronasafe@123", "Coronasafe@1233");
    manageUserPage.clickSubmit();
    loginPage.ensureLoggedIn();
    loginPage.clickSignOutBtn();
    loginPage.loginManuallyAsNurse("Coronasafe@1233");
    loginPage.ensureLoggedIn();
    cy.visit("/users");
    userPage.typeInSearchInput(nurseUsername);
    userPage.checkUsernameText(nurseUsername);
    manageUserPage.clickMoreDetailsButton(nurseUsername);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickPasswordEditButton();
    manageUserPage.changePassword("Coronasafe@1233", "Coronasafe@123");
    manageUserPage.clickSubmit();
    loginPage.ensureLoggedIn();
    loginPage.clickSignOutBtn();
    loginPage.loginManuallyAsDistrictAdmin();
    loginPage.ensureLoggedIn();
  });

  it("District Admin can delete a user", () => {
    userPage.typeInSearchInput(doctorToDelete);
    userPage.checkUsernameText(doctorToDelete);
    manageUserPage.clickMoreDetailsButton(doctorToDelete);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.verifyDeleteButtonVisible();
    manageUserPage.clickDeleteButton();
    manageUserPage.clickSubmit();
    cy.verifyNotification("User Deleted Successfully");
    cy.closeNotification();
    userPage.typeInSearchInput(doctorToDelete);
    userPage.checkUsernameTextDoesNotExist(doctorToDelete);
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
    manageUserPage.clickAddSkillButton(usernameforworkinghour);
    cy.wait(500);
    manageUserPage.assertSkillInAddedUserSkills(linkedskill);
    cy.wait(500);
    manageUserPage.navigateToProfile();
    cy.verifyContentPresence("#username-profile-details", [
      usernameforworkinghour,
    ]);
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
    advanceFilters.clickAdvancedFiltersButton();
    userPage.typeInFirstName(firstNameUserSkill);
    userPage.typeInLastName(lastNameUserSkill);
    userPage.selectHomeFacility(facilitytolinkskill);
    advanceFilters.applySelectedFilter();
    userPage.checkUsernameText(usernameToLinkSkill);
    manageUserPage.clickMoreDetailsButton(usernameToLinkSkill);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickLinkedSkillTab();
    manageUserPage.verifyLinkedSkillsTabPage();
    manageUserPage.selectSkillFromDropdown(linkedskill);
    manageUserPage.clickAddSkillButton(usernameToLinkSkill);
    cy.verifyNotification("Skill added successfully");
    cy.closeNotification();
    manageUserPage.assertSkillInAddedUserSkills(linkedskill);
    // verifying the doctor connect
    facilityHome.navigateToFacilityHomepage();
    facilityHome.typeFacilitySearch(facilitytolinkskill);
    facilityHome.assertFacilityInCard(facilitytolinkskill);
    manageUserPage.clickFacilityPatients();
    manageUserPage.clickDoctorConnectButton();
    manageUserPage.assertSkillIndoctorconnect(linkedskill);
  });

  it("add working hour for a user and verify its reflection in card and user profile", () => {
    // verify qualification and yoe and council registration fields are not present
    // verify field error and add working hour
    userPage.typeInSearchInput(usernameforworkinghour);
    userPage.checkUsernameText(usernameforworkinghour);
    manageUserPage.clickMoreDetailsButton(usernameforworkinghour);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.verifyProfileTabPage();
    manageUserPage.clickProfessionalInfoViewButton();
    manageUserPage.verifyQualificationDoesntExist();
    manageUserPage.verifyYoeAndCouncilRegistrationDoesntExist();
    manageUserPage.clickProfessionalInfoEditButton();
    manageUserPage.clearProfessionalInfo();
    manageUserPage.typeInWeeklyWorkingHours("200");
    manageUserPage.clickSubmit();
    manageUserPage.verifyErrorText(
      "Average weekly working hours must be a number between 0 and 168",
    );
    manageUserPage.clearProfessionalInfo();
    manageUserPage.typeInWeeklyWorkingHours(workinghour);
    manageUserPage.clickSubmit();
    // verify the data is reflected in the page
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
    facilityHome.navigateToFacilityHomepage();
    facilityHome.typeFacilitySearch(facilitytolinkusername);
    facilityHome.assertFacilityInCard(facilitytolinkusername);
    manageUserPage.clickFacilityPatients();
    manageUserPage.clickDoctorConnectButton();
    manageUserPage.assertDoctorConnectVisibility(usernamerealname);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
