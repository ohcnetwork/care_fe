import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { UserPage } from "../../pageobject/Users/UserSearch";
import ManageUserPage from "../../pageobject/Users/ManageUserPage";

describe("Manage User", () => {
  const loginPage = new LoginPage();
  const userPage = new UserPage();
  const manageUserPage = new ManageUserPage();
  const usernametolinkfacilitydoc1 = "dummydoctor4";
  const usernametolinkfacilitydoc2 = "dummydoctor5";
  const usernametolinkfacilitydoc3 = "dummydoctor6";
  const usernametolinkskill = "devdistrictadmin";
  const usernamerealname = "Dummy Doctor";
  const facilitytolinkusername = "Dummy Shifting Center";
  const workinghour = "23";

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/users");
  });

  it("add working hour for a user and verify its reflection in card and user profile", () => {
    // verify mandatory field error and select working hour for a user
    userPage.typeInSearchInput(usernametolinkskill);
    userPage.checkUsernameText(usernametolinkskill);
    manageUserPage.clicksetaveragehourbutton();
    manageUserPage.clearweeklyhourfield();
    manageUserPage.clickSubmit();
    manageUserPage.verifyErrorText("Value should be between 0 and 168");
    // verify the data is reflected in user card and profile page
    manageUserPage.typeInWeeklyWorkingHours(workinghour);
    manageUserPage.clickSubmit();
    manageUserPage.verifyWorkingHours(workinghour);
    manageUserPage.navigateToProfile();
    manageUserPage.verifyProfileWorkingHours(workinghour);
  });

  it("linking and unlinking facility for multiple users, and confirm reflection in user cards and doctor connect", () => {
    // verify the user doesn't have any home facility
    userPage.typeInSearchInput(usernametolinkfacilitydoc1);
    userPage.checkUsernameText(usernametolinkfacilitydoc1);
    manageUserPage.assertHomeFacility("No Home Facility");
    //  Link a new facility and ensure it is under linked facility - doctor username (1)
    manageUserPage.clickFacilitiesTab();
    manageUserPage.typeFacilityName(facilitytolinkusername);
    manageUserPage.selectFacilityFromDropdown(facilitytolinkusername);
    manageUserPage.clickLinkFacility();
    manageUserPage.assertLinkedFacility(facilitytolinkusername);
    //  Verify in the already linked facility are not present in droplist
    manageUserPage.assertFacilityNotInDropdown(facilitytolinkusername);
    manageUserPage.clickCloseSlideOver();
    //  Link a new facility and ensure it is under home facility - doctor username (2)
    userPage.clearSearchInput();
    userPage.typeInSearchInput(usernametolinkfacilitydoc2);
    userPage.checkUsernameText(usernametolinkfacilitydoc2);
    manageUserPage.clickFacilitiesTab();
    manageUserPage.typeFacilityName(facilitytolinkusername);
    manageUserPage.selectFacilityFromDropdown(facilitytolinkusername);
    manageUserPage.clickLinkFacility();
    manageUserPage.clickHomeFacilityIcon();
    manageUserPage.assertnotLinkedFacility(facilitytolinkusername);
    manageUserPage.assertHomeFacilitylink(facilitytolinkusername);
    manageUserPage.clickCloseSlideOver();
    //  verify the home facility doctor id have reflection in user card
    userPage.clearSearchInput();
    userPage.typeInSearchInput(usernametolinkfacilitydoc2);
    userPage.checkUsernameText(usernametolinkfacilitydoc2);
    manageUserPage.assertHomeFacility(facilitytolinkusername);
    // Link a new facility and unlink the facility from the doctor username (3)
    userPage.clearSearchInput();
    userPage.typeInSearchInput(usernametolinkfacilitydoc3);
    userPage.checkUsernameText(usernametolinkfacilitydoc3);
    manageUserPage.clickFacilitiesTab();
    manageUserPage.typeFacilityName(facilitytolinkusername);
    manageUserPage.selectFacilityFromDropdown(facilitytolinkusername);
    manageUserPage.clickLinkFacility();
    manageUserPage.clickUnlinkFacilityButton();
    manageUserPage.clickSubmit();
    manageUserPage.assertnotLinkedFacility;
    manageUserPage.linkedfacilitylistnotvisible();
    manageUserPage.clickCloseSlideOver();
    //  Go to particular facility doctor connect and all user-id are reflected based on there access
    // Path will be facility page to patient page then doctor connect button
    manageUserPage.navigateToFacility();
    manageUserPage.typeFacilitySearch(facilitytolinkusername);
    manageUserPage.assertFacilityInCard(facilitytolinkusername);
    manageUserPage.clickFacilityPatients();
    manageUserPage.clickDoctorConnectButton();
    manageUserPage.assertDoctorConnectVisibility(usernamerealname);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
