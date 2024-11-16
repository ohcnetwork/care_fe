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
    userCreationPage.clickElementById("user-profile-name");
    userCreationPage.clickElementById("profile-button");
    userCreationPage.verifyElementContainsText(
      "username-profile-details",
      "devdistrictadmin",
    );
    userCreationPage.clickElementById("edit-cancel-profile-button");
    userCreationPage.typeIntoElementByIdPostClear(
      "firstName",
      "District Editted",
    );
    userCreationPage.typeIntoElementByIdPostClear("lastName", "Cypress");
    userCreationPage.selectDropdownOption("gender", "Male");
    userCreationPage.typeIntoElementByIdPostClear("phoneNumber", phone_number);
    userCreationPage.typeIntoElementByIdPostClear(
      "altPhoneNumber",
      emergency_phone_number,
    );
    userCreationPage.typeIntoElementByIdPostClear("email", "test@test.com");
    userCreationPage.typeIntoElementByIdPostClear("weekly_working_hours", "14");
    userCreationPage.typeIntoElementByIdPostClearDob(
      "date_of_birth",
      "01011998",
    );
    userCreationPage.clickElementById("submit");
    userCreationPage.verifyElementContainsText(
      "contactno-profile-details",
      "+91" + phone_number,
    );
    userCreationPage.verifyElementContainsText(
      "whatsapp-profile-details",
      "+91" + emergency_phone_number,
    );
    userCreationPage.verifyElementContainsText(
      "firstname-profile-details",
      "District Editted",
    );
    userCreationPage.verifyElementContainsText(
      "lastname-profile-details",
      "Cypress",
    );
    userCreationPage.verifyElementContainsText(
      "date_of_birth-profile-details",
      "01/01/1998",
    );
    userCreationPage.verifyElementContainsText(
      "emailid-profile-details",
      "test@test.com",
    );
    userCreationPage.verifyElementContainsText(
      "gender-profile-details",
      "Male",
    );
    userCreationPage.verifyElementContainsText(
      "averageworkinghour-profile-details",
      "14",
    );
  });

  it("Update the existing user profile Form Mandatory File Error", () => {
    userCreationPage.clickElementById("user-profile-name");
    userCreationPage.clickElementById("profile-button");
    userCreationPage.clickElementById("edit-cancel-profile-button");
    userCreationPage.clearIntoElementById("firstName");
    userCreationPage.clearIntoElementById("lastName");
    userCreationPage.clearIntoElementById("phoneNumber");
    userCreationPage.clearIntoElementById("altPhoneNumber");
    userCreationPage.clearIntoElementById("weekly_working_hours");
    userCreationPage.clickElementById("submit");
    userCreationPage.verifyErrorMessages(EXPECTED_PROFILE_ERROR_MESSAGES);
  });

  it("create new user and verify reflection", () => {
    userCreationPage.clickElementById("addUserButton");
    userCreationPage.selectFacility("Dummy Shifting Center");
    userCreationPage.typeIntoElementById("username", username);
    userCreationPage.typeIntoElementById("password", "Test@123");
    userCreationPage.selectHomeFacility("Dummy Shifting Center");
    userCreationPage.typeIntoElementById("phone_number", phone_number);
    userCreationPage.setInputDate("date_of_birth", "25081999");
    userCreationPage.selectDropdownOption("user_type", "Doctor");
    userCreationPage.typeIntoElementById("c_password", "Test@123");
    userCreationPage.typeIntoElementById("qualification", "MBBS");
    userCreationPage.typeIntoElementById("doctor_experience_commenced_on", "2");
    userCreationPage.typeIntoElementById(
      "doctor_medical_council_registration",
      "123456789",
    );
    userCreationPage.typeIntoElementById("first_name", "cypress test");
    userCreationPage.typeIntoElementById("last_name", "staff user");
    userCreationPage.typeIntoElementById("email", "test@test.com");
    userCreationPage.selectDropdownOption("gender", "Male");
    userCreationPage.selectDropdownOption("state", "Kerala");
    userCreationPage.selectDropdownOption("district", "Ernakulam");
    userCreationPage.clickElementById("submit");
    userCreationPage.verifyNotification("User added successfully");
    userPage.typeInSearchInput(username);
    userPage.checkUsernameText(username);
    userCreationPage.verifyElementContainsText("name", "cypress test");
    userCreationPage.verifyElementContainsText("role", "Doctor");
    userCreationPage.verifyElementContainsText("district", "Ernakulam");
    userCreationPage.verifyElementContainsText(
      "home_facility",
      "Dummy Shifting Center",
    );
    userCreationPage.verifyElementContainsText("qualification", "MBBS");
    userCreationPage.verifyElementContainsText("doctor-experience", "2");
    userCreationPage.verifyElementContainsText(
      "medical-council-registration",
      "123456789",
    );
  });

  it("create new user form throwing mandatory field error", () => {
    userCreationPage.clickElementById("addUserButton");
    userCreationPage.clickElementById("submit");
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
