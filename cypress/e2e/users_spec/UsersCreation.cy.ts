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
    loginPage.loginAsDisctrictAdmin();
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
    cy.verifyContentPresence("#username-profile-details", ["devdistrictadmin"]);

    userCreationPage.clickEditCancelProfileButton();
    userCreationPage.typeIntoFirstNameAndClear();
    userCreationPage.typeIntoLastNameAndClear();
    cy.get("#gender").click().get("[role='option']").contains("Male").click();
    userCreationPage.typeIntoPhoneNumberAndClear(phone_number);
    userCreationPage.typeIntoAltPhoneumberAndClear(emergency_phone_number);
    userCreationPage.typeIntoEmailAndClear();
    userCreationPage.typeIntoWeeklyWorkingHoursAndClear();
    userCreationPage.typeIntoElementByIdPostClearDob(
      "date_of_birth",
      "01011998",
    );
    cy.submitButton("Update");
    cy.verifyContentPresence("#contactno-profile-details", [
      "+91" + phone_number,
    ]);
    cy.verifyContentPresence("#whatsapp-profile-details", [
      "+91" + emergency_phone_number,
    ]);
    cy.verifyContentPresence("#firstname-profile-details", [
      "District Editted",
    ]);
    cy.verifyContentPresence("#lastname-profile-details", ["Cypress"]);
    cy.verifyContentPresence("#date_of_birth-profile-details", ["01/01/1998"]);
    cy.verifyContentPresence("#emailid-profile-details", ["test@test.com"]);
    cy.verifyContentPresence("#gender-profile-details", ["Male"]);
    cy.verifyContentPresence("#averageworkinghour-profile-details", ["14"]);
  });

  it("Update the existing user profile Form Mandatory File Error", () => {
    userCreationPage.clickProfileName();
    userCreationPage.clickProfileButton();
    userCreationPage.clickEditCancelProfileButton();

    userCreationPage.clearFirstName();
    userCreationPage.clearLastName();
    userCreationPage.clearPhoneNumber();
    userCreationPage.clearAltPhoneNumber();
    userCreationPage.clearWeeklyWorkingHours();
    cy.submitButton("Update");
    userCreationPage.verifyErrorMessages(EXPECTED_PROFILE_ERROR_MESSAGES);
  });

  it("create new user and verify reflection", () => {
    userCreationPage.clickAddUserButton();
    userCreationPage.selectFacility("Dummy Shifting Center");
    userCreationPage.typeUserName(username);
    userCreationPage.typePassword();
    userCreationPage.selectHomeFacility("Dummy Shifting Center");
    userCreationPage.typePhoneNumber(phone_number);
    cy.get("#date_of_birth")
      .click()
      .get("#date-input")
      .click()
      .type("25081999");
    cy.get("#user_type")
      .click()
      .get("[role='option']")
      .contains("Doctor")
      .click();
    userCreationPage.typeConfirmPassword();
    userCreationPage.typeQualification();
    userCreationPage.typeDoctorExperience();
    userCreationPage.typeDoctorMedicalCouncilRegNo();
    userCreationPage.typeFirstName();
    userCreationPage.typeLastName();
    userCreationPage.typeEmail();
    cy.get("#gender").click().get("[role='option']").contains("Male").click();
    cy.get("#state").click().get("[role='option']").contains("Kerala").click();
    cy.get("#district")
      .click()
      .get("[role='option']")
      .contains("Ernakulam")
      .click();
    userCreationPage.clickSubmit();
    cy.verifyNotification("User added successfully");
    userPage.typeInSearchInput(username);
    userPage.checkUsernameText(username);
    cy.verifyContentPresence("#name", ["cypress test"]);
    cy.verifyContentPresence("#role", ["Doctor"]);
    cy.verifyContentPresence("#district", ["Ernakulam"]);
    cy.verifyContentPresence("#home_facility", ["Dummy Shifting Center"]);
    cy.verifyContentPresence("#qualification", ["MBBS"]);
    cy.verifyContentPresence("#doctor-experience", ["2"]);
    cy.verifyContentPresence("#medical-council-registration", ["123456789"]);
  });

  it("create new user form throwing mandatory field error", () => {
    userCreationPage.clickAddUserButton();
    cy.submitButton("Save User");
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
