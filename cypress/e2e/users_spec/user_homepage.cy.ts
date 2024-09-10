import LoginPage from "../../pageobject/Login/LoginPage";
import { UserPage } from "../../pageobject/Users/UserSearch";

describe("User Homepage", () => {
  const userPage = new UserPage();
  const usernameToTest = "devdoctor";
  const currentuser = "devdistrictadmin";
  const loginPage = new LoginPage();

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
    userPage.typeInFirstName("Dummy");
    userPage.typeInLastName("Nurse");
    userPage.selectRole("Nurse");
    userPage.selectState("Kerala");
    userPage.selectDistrict("Ernakulam");
    userPage.typeInPhoneNumber("8878825662");
    userPage.typeInAltPhoneNumber("8878825662");
    userPage.selectHomeFacility("Dummy Facility 40");
    userPage.applyFilter();
    userPage.verifyUrlafteradvancefilter();
    userPage.checkUsernameText(usernameToTest);
    userPage.verifyDataTestIdText("First Name", "First Name: Dummy");
    userPage.verifyDataTestIdText("Last Name", "Last Name: Nurse");
    userPage.verifyDataTestIdText(
      "Phone Number",
      "Phone Number: +918878825662",
    );
    userPage.verifyDataTestIdText(
      "WhatsApp no.",
      "WhatsApp no.: +918878825662",
    );
    userPage.verifyDataTestIdText("Role", "Role: Nurse");
    userPage.verifyDataTestIdText(
      "Home Facility",
      "Home Facility: Dummy Facility 40",
    );
    userPage.verifyDataTestIdText("District", "District: Ernakulam");
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
    userPage.typeInSearchInput(usernameToTest);
    userPage.checkUrlForUsername(usernameToTest);
    userPage.checkUsernameText(usernameToTest);
    userPage.checkUsernameBadgeVisibility(true);
    userPage.clearSearchInput();
    userPage.checkUsernameBadgeVisibility(false);
    userPage.typeInSearchInput(usernameToTest);
    userPage.checkUsernameText(usernameToTest);
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
