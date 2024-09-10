import LoginPage from "../../pageobject/Login/LoginPage";
import { UserPage } from "../../pageobject/Users/UserSearch";

describe("User Homepage", () => {
  const userPage = new UserPage();
  const loginPage = new LoginPage();
  const currentuser = "devdistrictadmin";
  const firstName = "Dummy";
  const lastName = "Nurse";
  const role = "Nurse";
  const state = "Kerala";
  const district = "Ernakulam";
  const phoneNumber = "8878825662";
  const altPhoneNumber = "8878825662";
  const homeFacility = "Dummy Facility 40";
  const nurseUserName = "dummynurse1";
  const doctorUserName = "devdoctor";

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/users");
  });

  it("User advance filter functionality", () => {
    userPage.clickAdvancedFilters();
    userPage.typeInFirstName(firstName);
    userPage.typeInLastName(lastName);
    userPage.selectRole(role);
    userPage.selectState(state);
    userPage.selectDistrict(district);
    userPage.typeInPhoneNumber(phoneNumber);
    userPage.typeInAltPhoneNumber(altPhoneNumber);
    userPage.selectHomeFacility(homeFacility);
    userPage.applyFilter();
    userPage.checkUsernameText(nurseUserName);
    // Verify the badges related to the data
    userPage.verifyDataTestIdText("First Name", `First Name: ${firstName}`);
    userPage.verifyDataTestIdText("Last Name", `Last Name: ${lastName}`);
    userPage.verifyDataTestIdText(
      "Phone Number",
      `Phone Number: +91${phoneNumber}`,
    );
    userPage.verifyDataTestIdText(
      "WhatsApp no.",
      `WhatsApp no.: +91${altPhoneNumber}`,
    );
    userPage.verifyDataTestIdText("Role", `Role: ${role}`);
    userPage.verifyDataTestIdText(
      "Home Facility",
      `Home Facility: ${homeFacility}`,
    );
    userPage.clearFilters();
    userPage.verifyDataTestIdNotVisible("First Name");
    userPage.verifyDataTestIdNotVisible("Last Name");
    userPage.verifyDataTestIdNotVisible("Phone Number");
    userPage.verifyDataTestIdNotVisible("WhatsApp no.");
    userPage.verifyDataTestIdNotVisible("Role");
    userPage.verifyDataTestIdNotVisible("Home Facility");
    userPage.verifyDataTestIdNotVisible("District");
  });

  it("Search by username", () => {
    userPage.checkSearchInputVisibility();
    userPage.typeInSearchInput(doctorUserName);
    userPage.checkUrlForUsername(doctorUserName);
    userPage.checkUsernameText(doctorUserName);
    userPage.checkUsernameBadgeVisibility(true);
    userPage.clearSearchInput();
    userPage.checkUsernameBadgeVisibility(false);
    userPage.typeInSearchInput(doctorUserName);
    userPage.checkUsernameText(doctorUserName);
    userPage.clickRemoveIcon();
    userPage.checkUsernameBadgeVisibility(false);
    userPage.checkUsernameText(currentuser);
  });

  it("Next/Previous Page Navigation", () => {
    userPage.navigateToNextPage();
    userPage.verifyCurrentPageNumber(2);
    userPage.navigateToPreviousPage();
    userPage.verifyCurrentPageNumber(1);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
