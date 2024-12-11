import FacilityHome from "pageobject/Facility/FacilityHome";
import ManageUserPage from "pageobject/Users/ManageUserPage";
import UserProfilePage from "pageobject/Users/UserProfilePage";
import { advanceFilters } from "pageobject/utils/advanceFilterHelpers";

import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import LoginPage from "../../pageobject/Login/LoginPage";
import { UserCreationPage } from "../../pageobject/Users/UserCreation";
import { UserPage } from "../../pageobject/Users/UserSearch";
import {
  generateEmergencyPhoneNumber,
  generatePhoneNumber,
} from "../../pageobject/utils/constants";

describe("User Creation", () => {
  const userPage = new UserPage();
  const loginPage = new LoginPage();
  const userProfilePage = new UserProfilePage();
  const manageUserPage = new ManageUserPage();
  const userCreationPage = new UserCreationPage();
  const facilityPage = new FacilityPage();
  const facilityHome = new FacilityHome();
  const phoneNumber = generatePhoneNumber();
  const emergencyPhoneNumber = generateEmergencyPhoneNumber();
  const fillFacilityName = "Dummy Facility 40";
  const makeId = (length: number) => {
    let result = "";
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };
  const username = makeId(8);
  const alreadyLinkedUsersViews = [
    "devdoctor",
    "devstaff2",
    "devdistrictadmin",
  ];
  const EXPECTED_ERROR_MESSAGES = [
    "Please select the User Type",
    "Please enter valid phone number",
    "Please enter the username",
    "Please enter date in DD/MM/YYYY format",
    "Password is required",
    "Confirm password is required",
    "First Name is required",
    "Last Name is required",
    "Please enter a valid email address",
    "Please select the Gender",
    "Please select the state",
    "Please select the district",
    "Please select the local body",
  ];

  const EXPECTED_PROFILE_ERROR_MESSAGES = [
    "This field is required",
    "This field is required",
    "Please enter valid phone number",
  ];
  const userName = "devdistrictadmin";
  const firstName = "District Editted";
  const lastName = "Cypress";
  const gender = "Male";
  const email = "test@test.com";
  const password = "Test@123";
  const qualification = "MBBS";
  const experience = "2";
  const regNo = "123456789";
  const newUserFirstName = "cypress test";
  const newUserLastName = "staff user";
  const state = "Kerala";
  const district = "Ernakulam";
  const role = "Doctor";
  const homeFacility = "Dummy Shifting Center";
  const weeklyWorkingHrs = "14";
  const dob = "01011998";
  const formattedDob = "01/01/1998";
  const newUserDob = "25081999";

  before(() => {
    loginPage.loginByRole("districtAdmin");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/users");
  });

  it("Update the existing user profile and verify its reflection", () => {
    manageUserPage.navigateToProfile();
    cy.verifyContentPresence("#username-profile-details", [userName]);
    userProfilePage.clickEditProfileButton();
    userCreationPage.clearFirstName();
    userCreationPage.typeFirstName(firstName);
    userCreationPage.clearLastName();
    userCreationPage.typeLastName(lastName);
    userProfilePage.selectGender(gender);
    userProfilePage.clearPhoneNumber();
    userProfilePage.typePhoneNumber(phoneNumber);
    userProfilePage.clearAltPhoneNumber();
    userProfilePage.typeWhatsappNumber(emergencyPhoneNumber);
    userProfilePage.clearEmail();
    userProfilePage.typeEmail(email);
    userProfilePage.clearWorkingHours();
    userProfilePage.typeWorkingHours(weeklyWorkingHrs);
    userProfilePage.typeDateOfBirth(dob);
    userProfilePage.interceptUpdateUsers();
    userProfilePage.clickUpdateButton();
    userProfilePage.verifyUpdateUsersResponse();
    cy.verifyContentPresence("#contactno-profile-details", [
      "+91" + phoneNumber,
    ]);
    cy.verifyContentPresence("#whatsapp-profile-details", [
      "+91" + emergencyPhoneNumber,
    ]);
    cy.verifyContentPresence("#firstname-profile-details", [firstName]);
    cy.verifyContentPresence("#lastname-profile-details", [lastName]);
    cy.verifyContentPresence("#date_of_birth-profile-details", [formattedDob]);
    cy.verifyContentPresence("#emailid-profile-details", [email]);
    cy.verifyContentPresence("#gender-profile-details", [gender]);
    cy.verifyContentPresence("#averageworkinghour-profile-details", [
      weeklyWorkingHrs,
    ]);
  });

  it("Update the existing user profile Form Mandatory File Error", () => {
    manageUserPage.navigateToProfile();
    userProfilePage.clickEditProfileButton();
    userCreationPage.clearFirstName();
    userCreationPage.clearLastName();
    userProfilePage.clearPhoneNumber();
    userProfilePage.clearAltPhoneNumber();
    userProfilePage.clearWorkingHours();
    userProfilePage.clickUpdateButton();
    cy.verifyErrorMessages(EXPECTED_PROFILE_ERROR_MESSAGES);
  });

  it("create new user and verify reflection", () => {
    userCreationPage.clickAddUserButton();
    userCreationPage.selectFacility(homeFacility);
    userCreationPage.typeUserName(username);
    userCreationPage.typePassword(password);
    userCreationPage.typeConfirmPassword(password);
    userCreationPage.selectHomeFacility(homeFacility);
    userPage.typeInPhoneNumber(phoneNumber);
    userProfilePage.typeDateOfBirth(newUserDob);
    userCreationPage.selectUserType(role);
    userProfilePage.typeQualification(qualification);
    userProfilePage.typeDoctorYoE(experience);
    userProfilePage.typeMedicalCouncilRegistration(regNo);
    userPage.typeInFirstName(newUserFirstName);
    userPage.typeInLastName(newUserLastName);
    userProfilePage.typeEmail(email);
    userCreationPage.selectGender(gender);
    userCreationPage.selectState(state);
    userCreationPage.selectDistrict(district);
    userCreationPage.interceptCreateUser();
    userCreationPage.clickSaveUserButton();
    userCreationPage.verifyCreateUser();
    cy.verifyNotification("User added successfully");
    userPage.typeInSearchInput(username);
    userPage.checkUsernameText(username);
    cy.verifyContentPresence(`#name-${username}`, [newUserFirstName]);
    cy.verifyContentPresence("#role", [role]);
    cy.verifyContentPresence("#district", [district]);
    cy.verifyContentPresence("#home-facility", [homeFacility]);
  });

  it("create new user form throwing mandatory field error", () => {
    userCreationPage.clickAddUserButton();
    userCreationPage.clickSaveUserButton();
    cy.get(".error-text", { timeout: 10000 }).should("be.visible");
    cy.verifyErrorMessages(EXPECTED_ERROR_MESSAGES);
  });

  it("view user redirection from facility page", () => {
    facilityHome.navigateToFacilityHomepage();
    facilityHome.typeFacilitySearch(fillFacilityName);
    advanceFilters.verifyFilterBadgePresence(
      "Facility/District Name",
      fillFacilityName,
      true,
    );
    facilityPage.visitAlreadyCreatedFacility();
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickViewUsersOption();
    userPage.verifyMultipleBadgesWithSameId(alreadyLinkedUsersViews);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
