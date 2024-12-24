import * as dayjs from "dayjs";
import FacilityHome from "pageobject/Facility/FacilityHome";
import { advanceFilters } from "pageobject/utils/advanceFilterHelpers";
import { generatePhoneNumber } from "pageobject/utils/constants";

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
    const basicInfoErrorMessages = [
      "First Name is required",
      "Last Name is required",
    ];
    const modifiedFirstName = "Devo";
    const modifiedLastName = "Districto";
    const modifiedRawDOB = "11081999";
    const modifiedGender = "Female";
    const modifiedFormattedDOB = "11/08/1999";
    userPage.typeInSearchInput(nurseUsername);
    userPage.checkUsernameText(nurseUsername);
    manageUserPage.clickMoreDetailsButton(nurseUsername);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickBaicInfoViewButton();
    manageUserPage.clickBasicInfoEditButton();
    manageUserPage.clearUserBasicInfo();
    manageUserPage.clickUserInfoSubmitButton();
    cy.verifyErrorMessages(basicInfoErrorMessages);
    manageUserPage.editUserBasicInfo(
      modifiedFirstName,
      modifiedLastName,
      modifiedRawDOB,
      modifiedGender,
    );
    manageUserPage.clickUserInfoSubmitButton();
    manageUserPage.userInfoUpdateSuccessNotification();
    manageUserPage.clickBaicInfoViewButton();
    manageUserPage.verifyEditUserDetails(
      modifiedFirstName,
      modifiedLastName,
      modifiedFormattedDOB,
      modifiedGender,
    );
  });

  it("edit a nurse user's contact information and verify its reflection", () => {
    const contactInfoErrorMessages = [
      "Please enter a valid email address",
      "Please enter valid phone number",
    ];
    const modifiedEmail = "dev@gmail.com";
    const modifiedPhone = generatePhoneNumber();
    userPage.typeInSearchInput(nurseUsername);
    userPage.checkUsernameText(nurseUsername);
    manageUserPage.clickMoreDetailsButton(nurseUsername);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickContactInfoViewButton();
    manageUserPage.clickContactInfoEditButton();
    manageUserPage.clearUserContactInfo();
    manageUserPage.clickUserInfoSubmitButton();
    cy.verifyErrorMessages(contactInfoErrorMessages);
    manageUserPage.editUserContactInfo(modifiedEmail, modifiedPhone);
    manageUserPage.clickUserInfoSubmitButton();
    manageUserPage.userInfoUpdateSuccessNotification();
    manageUserPage.clickContactInfoViewButton();
    manageUserPage.verifyEditUserContactInfo(modifiedEmail, modifiedPhone);
  });

  it("edit a nurse user's professional information and verify its reflection", () => {
    const qualificationErrorMessages = ["Qualification is required"];
    const qualification = "Msc";
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
    manageUserPage.clickUserInfoSubmitButton();
    cy.verifyErrorMessages(qualificationErrorMessages);
    manageUserPage.editUserProfessionalInfo(qualification);
    manageUserPage.clickUserInfoSubmitButton();
    manageUserPage.userInfoUpdateSuccessNotification();
    manageUserPage.clickProfessionalInfoViewButton();
    manageUserPage.verifyEditUserProfessionalInfo(qualification);
  });

  it("edit a doctor user's professional information and verify its reflection", () => {
    // Should have qualification, years of experience and medical council registration
    const qualificationErrorMessages = [
      "Qualification is required",
      "Years of experience is required",
      "Medical Council Registration is required",
    ];
    const qualification = "Msc";
    const yoe = "120";
    const modifiedYoe = "10";
    const medicalRegistrationNumber = "1234567890";
    const experienceCommencedOn = dayjs().subtract(10, "year");
    const formattedDate = dayjs(experienceCommencedOn).format("YYYY-MM-DD");
    userPage.typeInSearchInput(usernameToLinkFacilitydoc1);
    userPage.checkUsernameText(usernameToLinkFacilitydoc1);
    manageUserPage.clickMoreDetailsButton(usernameToLinkFacilitydoc1);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickProfessionalInfoViewButton();
    manageUserPage.verifyQualificationExist();
    manageUserPage.verifyYoeAndCouncilRegistrationExist();
    manageUserPage.clickProfessionalInfoEditButton();
    manageUserPage.clearDoctorOrNurseProfessionalInfo(true);
    manageUserPage.clickUserInfoSubmitButton();
    cy.verifyErrorMessages(qualificationErrorMessages);
    manageUserPage.editUserProfessionalInfo(
      qualification,
      yoe,
      medicalRegistrationNumber,
    );
    manageUserPage.clickUserInfoSubmitButton();
    cy.verifyErrorMessages(["Please enter a valid number between 0 and 100."]);
    manageUserPage.clearDoctorOrNurseProfessionalInfo(true);
    manageUserPage.editUserProfessionalInfo(
      qualification,
      modifiedYoe,
      medicalRegistrationNumber,
    );
    manageUserPage.clickUserInfoSubmitButton();
    manageUserPage.userInfoUpdateSuccessNotification();
    manageUserPage.clickProfessionalInfoViewButton();
    manageUserPage.verifyEditUserProfessionalInfo(
      qualification,
      formattedDate,
      medicalRegistrationNumber,
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
    cy.verifyContentPresence("#view-username", [doctorUsername]);
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
    cy.verifyAndClickElement("#change-edit-password-button", "Change Password");
    manageUserPage.changePassword("Coronasafe@123", "Coronasafe@1233");
    cy.clickSubmitButton();
    cy.verifyNotification("Password updated successfully");
    cy.closeNotification();
    loginPage.ensureLoggedIn();
    loginPage.clickSignOutBtn();
    loginPage.loginManuallyAsNurse("Coronasafe@1233");
    loginPage.ensureLoggedIn();
    cy.visit("/users");
    userPage.typeInSearchInput(nurseUsername);
    userPage.checkUsernameText(nurseUsername);
    manageUserPage.clickMoreDetailsButton(nurseUsername);
    manageUserPage.verifyMoreDetailsPage();
    cy.verifyAndClickElement("#change-edit-password-button", "Change Password");
    manageUserPage.changePassword("Coronasafe@1233", "Coronasafe@123");
    cy.clickSubmitButton();
    cy.verifyNotification("Password updated successfully");
    cy.closeNotification();
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
    cy.clickSubmitButton("Delete");
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
    manageUserPage.interceptLinkedSkillTab();
    manageUserPage.clickLinkedSkillTab();
    manageUserPage.verifyLinkedSkillResponse();
    manageUserPage.verifyLinkedSkillsTabPage();
    manageUserPage.selectSkillFromDropdown(linkedskill);
    manageUserPage.interceptAddSkill();
    manageUserPage.clickAddSkillButton(usernameforworkinghour);
    manageUserPage.verifyAddSkillResponse();
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

  it("add working hour and video connect link for a user and verify its reflection in card and user profile", () => {
    // verify qualification and yoe and council registration fields are not present
    // verify field error and add working hour
    userPage.typeInSearchInput(usernameforworkinghour);
    userPage.checkUsernameText(usernameforworkinghour);
    manageUserPage.clickMoreDetailsButton(usernameforworkinghour);
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.verifyProfileTabPage();
    cy.verifyAndClickElement("#professional-info-view-button", "View");
    manageUserPage.verifyQualificationDoesntExist();
    manageUserPage.verifyYoeAndCouncilRegistrationDoesntExist();
    cy.verifyAndClickElement("#professional-info-edit-button", "Edit");
    manageUserPage.clearProfessionalInfo();
    manageUserPage.editWeeklyWorkingHours("200");
    cy.clickSubmitButton();
    cy.verifyErrorMessages([
      "Average weekly working hours must be a number between 0 and 168",
    ]);
    manageUserPage.clearProfessionalInfo();
    manageUserPage.editHoursAndVideoConnectLink(
      workinghour,
      "https://www.example.com",
    );
    cy.clickSubmitButton();
    cy.verifyNotification("User details updated successfully");
    cy.closeNotification();
    manageUserPage.verifyHoursAndVideoConnectLink(
      workinghour,
      "https://www.example.com",
    );
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
    cy.clickSubmitButton("Unlink");
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
