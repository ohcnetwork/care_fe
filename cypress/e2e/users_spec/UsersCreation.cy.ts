import FacilityHome from "pageobject/Facility/FacilityHome";
import { advanceFilters } from "pageobject/utils/advanceFilterHelpers";

import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import LoginPage from "../../pageobject/Login/LoginPage";
import { ManageUserPage } from "../../pageobject/Users/ManageUserPage";
import { UserCreationPage } from "../../pageobject/Users/UserCreation";
import { UserPage } from "../../pageobject/Users/UserSearch";
import { generatePhoneNumber } from "../../pageobject/utils/constants";

describe("User Creation", () => {
  const userPage = new UserPage();
  const loginPage = new LoginPage();
  const userCreationPage = new UserCreationPage();
  const manageUserPage = new ManageUserPage();
  const facilityPage = new FacilityPage();
  const facilityHome = new FacilityHome();
  const phoneNumber = generatePhoneNumber();
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

  it("create new user and verify reflection", () => {
    userCreationPage.clickAddUserButton();
    userCreationPage.selectFacility(homeFacility);
    userCreationPage.typeUserName(username);
    userCreationPage.typePassword(password);
    userCreationPage.typeConfirmPassword(password);
    userCreationPage.selectHomeFacility(homeFacility);
    userPage.typeInPhoneNumber(phoneNumber);
    manageUserPage.editDateOfBirth(newUserDob);
    userCreationPage.selectUserType(role);
    manageUserPage.editQualification(qualification, false);
    manageUserPage.editDoctorYoE(experience, false);
    manageUserPage.editMedicalCouncilRegistration(regNo, false);
    userPage.typeInFirstName(newUserFirstName);
    userPage.typeInLastName(newUserLastName);
    manageUserPage.editEmail(email, false);
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
    loginPage.ensureLoggedIn();
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
