import { AssetSearchPage } from "../../pageobject/Asset/AssetSearch";
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
  const userCreationPage = new UserCreationPage();
  const facilityPage = new FacilityPage();
  const assetSearchPage = new AssetSearchPage();
  const phone_number = generatePhoneNumber();
  const emergency_phone_number = generateEmergencyPhoneNumber();
  const fillFacilityName = "Dummy Facility 40";
  const makeid = (length: number) => {
    let result = "";
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };
  const username = makeid(8);
  const alreadylinkedusersviews = [
    "devdoctor",
    "devstaff2",
    "devdistrictadmin",
  ];
  const EXPECTED_ERROR_MESSAGES = [
    "Please select the User Type",
    "Please enter valid phone number",
    "Please enter the username",
    "Please enter date in DD/MM/YYYY format",
    "Please enter the password",
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
  const experince = "2";
  const reg_no = "123456789";
  const firstName_ = "cypress test";
  const lastName_ = "staff user";
  const state = "Kerala";
  const district = "Ernakulam";
  const role = "Doctor";
  const home_facility = "Dummy Shifting Center";
  const weekly_working_hrs = "14";
  const dob = "01011998";
  const formatted_dob = "01/01/1998";
  const update_btn = "Update";
  const save_btn = "Save User";
  const new_user_dob = "25081999";

  before(() => {
    loginPage.loginAsDistrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/users");
  });

  it("Update the existing user profile and verify its reflection", () => {
    userCreationPage.clickProfileName();
    userCreationPage.clickProfileButton();
    cy.verifyContentPresence("#username-profile-details", [userName]);
    userCreationPage.clickEditProfileButton();
    userCreationPage.clearFirstName();
    userCreationPage.typeFirstName(firstName);
    userCreationPage.clearLastName();
    userCreationPage.typeLastName(lastName);
    userCreationPage.selectGender(gender);
    userCreationPage.clearPhoneNumber();
    userCreationPage.typePhoneNumber(phone_number);
    userCreationPage.clearAltPhoneNumber();
    userCreationPage.typeAltPhoneNumber(emergency_phone_number);
    userCreationPage.clearEmail();
    userCreationPage.typeEmail(email);
    userCreationPage.clearWeeklyWorkingHours();
    userCreationPage.typeWeeklyWorkingHours(weekly_working_hrs);
    userCreationPage.typeDateOfBirth(dob);
    cy.submitButton(update_btn);
    cy.verifyContentPresence("#contactno-profile-details", [
      "+91" + phone_number,
    ]);
    cy.verifyContentPresence("#whatsapp-profile-details", [
      "+91" + emergency_phone_number,
    ]);
    cy.verifyContentPresence("#firstname-profile-details", [firstName]);
    cy.verifyContentPresence("#lastname-profile-details", [lastName]);
    cy.verifyContentPresence("#date_of_birth-profile-details", [formatted_dob]);
    cy.verifyContentPresence("#emailid-profile-details", [email]);
    cy.verifyContentPresence("#gender-profile-details", [gender]);
    cy.verifyContentPresence("#averageworkinghour-profile-details", [
      weekly_working_hrs,
    ]);
  });

  it("Update the existing user profile Form Mandatory File Error", () => {
    userCreationPage.clickProfileName();
    userCreationPage.clickProfileButton();
    userCreationPage.clickEditProfileButton();
    userCreationPage.clearFirstName();
    userCreationPage.clearLastName();
    userCreationPage.clearPhoneNumber();
    userCreationPage.clearAltPhoneNumber();
    userCreationPage.clearWeeklyWorkingHours();
    cy.submitButton(update_btn);
    userCreationPage.verifyErrorMessages(EXPECTED_PROFILE_ERROR_MESSAGES);
  });

  it("create new user and verify reflection", () => {
    userCreationPage.clickAddUserButton();
    userCreationPage.selectFacility(home_facility);
    userCreationPage.typeUserName(username);
    userCreationPage.typePassword(password);
    userCreationPage.selectHomeFacility(home_facility);
    userCreationPage.typeNewUserPhoneNumber(phone_number);
    userCreationPage.typeDateOfBirth(new_user_dob);
    userCreationPage.selectUserType(role);
    userCreationPage.typeConfirmPassword(password);
    userCreationPage.typeQualification(qualification);
    userCreationPage.typeDoctorExperience(experince);
    userCreationPage.typeDoctorMedicalCouncilRegNo(reg_no);
    userCreationPage.typeNewUserFirstName(firstName_);
    userCreationPage.typeNewUserLastName(lastName_);
    userCreationPage.typeEmail(email);
    userCreationPage.selectGender(gender);
    userCreationPage.selectState(state);
    userCreationPage.selectDistrict(district);
    userCreationPage.clickSubmitButton();
    cy.verifyNotification("User added successfully");
    userPage.typeInSearchInput(username);
    userPage.checkUsernameText(username);
    cy.verifyContentPresence("#name", [firstName_]);
    cy.verifyContentPresence("#role", [role]);
    cy.verifyContentPresence("#district", [district]);
    cy.verifyContentPresence("#home_facility", [home_facility]);
    cy.verifyContentPresence("#qualification", [qualification]);
    cy.verifyContentPresence("#doctor-experience", [experince]);
    cy.verifyContentPresence("#medical-council-registration", [reg_no]);
  });

  it("create new user form throwing mandatory field error", () => {
    userCreationPage.clickAddUserButton();
    cy.submitButton(save_btn);
    cy.wait(2000);
    userCreationPage.verifyErrorMessages(EXPECTED_ERROR_MESSAGES);
  });

  it("view user redirection from facility page", () => {
    cy.visit("/facility");
    assetSearchPage.typeSearchKeyword(fillFacilityName);
    assetSearchPage.pressEnter();
    facilityPage.verifyFacilityBadgeContent(fillFacilityName);
    facilityPage.visitAlreadyCreatedFacility();
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickViewUsersOption();
    userPage.verifyMultipleBadgesWithSameId(alreadylinkedusersviews);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
