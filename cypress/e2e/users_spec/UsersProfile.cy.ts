import FacilityHome from "pageobject/Facility/FacilityHome";

import LoginPage from "../../pageobject/Login/LoginPage";
import ManageUserPage from "../../pageobject/Users/ManageUserPage";
import UserProfilePage from "../../pageobject/Users/UserProfilePage";

import dayjs = require("dayjs");

describe("Manage User Profile", () => {
  const loginPage = new LoginPage();
  const userProfilePage = new UserProfilePage();
  const manageUserPage = new ManageUserPage();
  const facilityHome = new FacilityHome();

  const date_of_birth = "01011999";
  const gender = "Male";
  const email = "test@example.com";
  const phone = "8899887788";
  const workinghours = "8";
  const qualification = "MBBS";
  const doctorYoE = "10";
  const medicalCouncilRegistration = "1234567890";

  const facilitySearch = "Dummy Facility 40";

  before(() => {
    loginPage.loginByRole("devDoctor");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/user/profile");
  });

  it("Set Dob and Gender for a user and verify its reflection in user profile", () => {
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickBasicInfoEditButton();
    manageUserPage.clearUserBasicInfo();
    manageUserPage.editUserBasicInfo("Devo", "Doctoro", date_of_birth, gender);
    userProfilePage.clickSubmit();
    manageUserPage.verifyEditUserDetails(
      "Devo",
      "Doctoro",
      "01/01/1999",
      "Male",
    );
  });

  it("Set Email and Phone for a user and verify its reflection in user profile", () => {
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickContactInfoEditButton();
    manageUserPage.clearUserContactInfo();
    manageUserPage.editUserContactInfo(email, phone);
    manageUserPage.clickSubmit();
    manageUserPage.verifyEditUserContactInfo(email, phone);
  });

  it("Set Qualification, YoE, Medical Council Registration, Weekly Working Hours and Video Connect Link for a user and verify its reflection in user profile", () => {
    manageUserPage.verifyMoreDetailsPage();
    manageUserPage.clickProfessionalInfoEditButton();
    manageUserPage.clearProfessionalInfo();
    manageUserPage.clearDoctorOrNurseProfessionalInfo(true);
    manageUserPage.editUserProfessionalInfo(
      qualification,
      doctorYoE,
      medicalCouncilRegistration,
    );
    manageUserPage.editHoursAndVideoConnectLink(
      workinghours,
      "https://www.example.com",
    );
    manageUserPage.clickSubmit();
    const experienceCommencedOn = dayjs().subtract(parseInt(doctorYoE), "year");
    const formattedDate = dayjs(experienceCommencedOn).format("YYYY-MM-DD");
    manageUserPage.verifyEditUserProfessionalInfo(
      qualification,
      formattedDate,
      medicalCouncilRegistration,
    );
    manageUserPage.verifyHoursAndVideoConnectLink(
      workinghours,
      "https://www.example.com",
    );
    manageUserPage.clickProfessionalInfoEditButton();
    manageUserPage.clearProfessionalInfo();
    manageUserPage.editHoursAndVideoConnectLink(
      workinghours,
      "https://www.test.com",
    );
    manageUserPage.clickSubmit();
    manageUserPage.verifyHoursAndVideoConnectLink(
      workinghours,
      "https://www.test.com",
    );
    facilityHome.navigateToFacilityHomepage();
    facilityHome.typeFacilitySearch(facilitySearch);
    facilityHome.assertFacilityInCard(facilitySearch);
    manageUserPage.clickFacilityPatients();
    manageUserPage.clickDoctorConnectButton();
    manageUserPage.assertVideoConnectLink(
      "Devo Doctoro",
      "https://www.test.com",
    );
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
