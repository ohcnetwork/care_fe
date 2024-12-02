// FacilityCreation
import { pageNavigation } from "pageobject/utils/paginationHelpers";

import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import FacilityHome from "../../pageobject/Facility/FacilityHome";
import FacilityNotify from "../../pageobject/Facility/FacilityNotify";
import LoginPage from "../../pageobject/Login/LoginPage";
import ManageUserPage from "../../pageobject/Users/ManageUserPage";
import { UserPage } from "../../pageobject/Users/UserSearch";
import { advanceFilters } from "../../pageobject/utils/advanceFilterHelpers";

describe("Facility Homepage Function", () => {
  const loginPage = new LoginPage();
  const facilityHome = new FacilityHome();
  const facilityNotify = new FacilityNotify();
  const facilityPage = new FacilityPage();
  const manageUserPage = new ManageUserPage();
  const userPage = new UserPage();
  const facilitiesAlias = "downloadFacilitiesCSV";
  const doctorsAlias = "downloadDoctorsCSV";
  const triagesAlias = "downloadTriagesCSV";
  const facilityName = "Dummy Facility 40";
  const facilityLocaion = "Dummy Location";
  const stateName = "Kerala";
  const district = "Ernakulam";
  const localBody = "Aikaranad";
  const facilityType = "Private Hospital";
  const notificationErrorMsg = "Message cannot be empty";
  const notificationMessage = "Test Notification";

  before(() => {
    loginPage.loginAsDistrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/facility");
  });

  it("Verify the Facility card button redirection", () => {
    // view cns button
    manageUserPage.typeFacilitySearch(facilityName);
    facilityPage.verifyFacilityBadgeContent(facilityName);
    manageUserPage.assertFacilityInCard(facilityName);
    facilityHome.clickViewCnsButton();
    facilityHome.verifyCnsUrl();
    facilityHome.navigateBack();
    // view facility button
    facilityHome.clickViewFacilityDetails();
    facilityPage.getFacilityName().should("be.visible");
    facilityHome.verifyFacilityDetailsUrl();
    facilityHome.navigateBack();
    // view patient button
    manageUserPage.clickFacilityPatients();
    facilityHome.verifyPatientListVisibility();
    facilityHome.verifyPatientListUrl();
    facilityHome.navigateBack();
    // occupancy badge
    facilityHome.verifyOccupancyBadgeVisibility();
  });

  it("Verify the functionality of advance filter", () => {
    advanceFilters.clickAdvancedFiltersButton();
    advanceFilters.selectState(stateName);
    advanceFilters.selectDistrict(district);
    advanceFilters.selectLocalBody(localBody);
    advanceFilters.selectFacilityType(facilityType);
    advanceFilters.applySelectedFilter();
    facilityPage.verifyStateBadgeContent(stateName);
    facilityPage.verifyDistrictBadgeContent(district);
    facilityPage.verifyLocalBodyBadgeContent(localBody);
    facilityPage.verifyFacilityTypeBadgeContent(facilityType);
    manageUserPage.assertFacilityInCard(facilityName);
    advanceFilters.clickAdvancedFiltersButton();
    advanceFilters.clickClearAdvanceFilters();
    userPage.verifyDataTestIdNotVisible("State");
    userPage.verifyDataTestIdNotVisible("District");
    userPage.verifyDataTestIdNotVisible("Facility type");
    userPage.verifyDataTestIdNotVisible("Local Body");
  });

  it("Search a facility in homepage and pagination", () => {
    // pagination of the facility page
    pageNavigation.navigateToNextPage();
    pageNavigation.verifyCurrentPageNumber(2);
    pageNavigation.navigateToPreviousPage();
    pageNavigation.verifyCurrentPageNumber(1);
    // search for a facility
    manageUserPage.typeFacilitySearch(facilityName);
    facilityPage.verifyFacilityBadgeContent(facilityName);
    manageUserPage.assertFacilityInCard(facilityName);
    facilityHome.verifyURLContains(facilityName);
  });

  it("Verify Facility Export Functionality", () => {
    // Verify Facility Export
    facilityHome.csvDownloadIntercept(facilitiesAlias, "");
    facilityHome.clickExportButton();
    facilityHome.clickMenuItem("Facilities");
    facilityHome.verifyDownload(facilitiesAlias);
    // Verify Doctor Export
    facilityHome.csvDownloadIntercept(doctorsAlias, "&doctors");
    facilityHome.clickExportButton();
    facilityHome.clickMenuItem("Doctors");
    facilityHome.verifyDownload(doctorsAlias);
    // Verify Triage Export
    facilityHome.csvDownloadIntercept(triagesAlias, "&triage");
    facilityHome.clickExportButton();
    facilityHome.clickMenuItem("Triages");
    facilityHome.verifyDownload(triagesAlias);
  });

  it("Verify Capacity Export Functionality", () => {
    facilityHome.clickExportButton();
    facilityHome.clickMenuItem("Capacities");
  });

  it("Verify Facility Detail page redirection to CNS and Live Minitoring  ", () => {
    advanceFilters.clickAdvancedFiltersButton();
    advanceFilters.selectState(stateName);
    advanceFilters.selectDistrict(district);
    advanceFilters.selectLocalBody(localBody);
    advanceFilters.applySelectedFilter();
    // go to cns page in the facility details page
    manageUserPage.typeFacilitySearch(facilityName);
    facilityPage.verifyFacilityBadgeContent(facilityName);
    manageUserPage.assertFacilityInCard(facilityName);
    facilityHome.clickViewFacilityDetails();
    facilityHome.clickFacilityCnsButton();
    facilityHome.verifyCnsUrl();
    facilityHome.navigateBack();
    // go to live monitoring page in the facility details page
    facilityHome.clickFacilityLiveMonitorButton();
    facilityHome.selectLocation(facilityLocaion);
    facilityHome.clickLiveMonitorButton();
    facilityHome.verifyLiveMonitorUrl();
  });

  it("Verify Notice Board Functionality", () => {
    // Log: Starting the test case
    cy.log("Starting 'Verify Notice Board Functionality' test");

    // Search facility and verify it's loaded or not
    manageUserPage.interceptFacilitySearchReq();
    manageUserPage.typeFacilitySearch(facilityName);
    manageUserPage.verifyFacilitySearchReq();

    // Log: Verifying facility search result
    cy.log("Facility search completed, verifying facility data");

    // Verify facility name and card reflection
    facilityNotify.verifyUrlContains("Dummy+Facility+40");
    facilityPage.verifyFacilityBadgeContent(facilityName);
    manageUserPage.assertFacilityInCard(facilityName);

    // Log: Facility details verified
    cy.log("Facility name and card reflection verified");

    // Send notification to a facility
    facilityHome.clickFacilityNotifyButton();
    facilityNotify.verifyFacilityName(facilityName);
    facilityNotify.fillNotifyText(notificationMessage);

    // Log: Notification filled with message
    cy.log("Filled notification message: " + notificationMessage);

    facilityNotify.interceptPostNotificationReq();
    cy.clickSubmitButton("Notify");
    facilityNotify.verifyPostNotificationReq();
    cy.verifyNotification("Facility Notified");
    cy.closeNotification();

    // Log: Notification successfully sent
    cy.log("Notification sent and closed");

    // Verify the frontend error on empty message
    facilityHome.clickFacilityNotifyButton();
    facilityNotify.verifyFacilityName(facilityName);
    cy.clickSubmitButton("Notify");
    facilityNotify.verifyErrorMessage(notificationErrorMsg);

    // Log: Error message displayed for empty notification
    cy.log("Error message displayed for empty notification");

    // Close pop-up and verify
    facilityHome.verifyAndCloseNotifyModal();

    // Log: Modal closed
    cy.log("Notification modal closed");

    // Sign out as district admin and login as Nurse
    loginPage.ensureLoggedIn(); // Ensure the admin is logged in before logging out
    loginPage.clickSignOutBtn(); // Sign out admin

    // Log: Logged out as district admin
    cy.log("Logged out as district admin");

    loginPage.loginManuallyAsNurse(); // Log in as Nurse

    // Log: Logged in as Nurse
    cy.log("Logged in as Nurse");

    // Wait for the nurse to be logged in by verifying the dashboard URL or nurse-specific element

    // Log: Nurse logged in and dashboard visible
    cy.log("Nurse dashboard is now visible");

    // Verify Notice Board Reflection
    facilityNotify.interceptGetNotificationReq("MESSAGE");
    facilityNotify.visitNoticeBoard();
    facilityNotify.verifyGetNotificationReq();
    facilityNotify.verifyFacilityNoticeBoardMessage(notificationMessage);
    facilityNotify.interceptGetNotificationReq();

    // Log: Verified notice board message
    cy.log("Notice board message verified");

    // Verify Sidebar Notification Reflection
    facilityNotify.openNotificationSlide();
    facilityNotify.verifyGetNotificationReq();
    cy.verifyContentPresence("#notification-slide-msg", [notificationMessage]);
    facilityNotify.closeNotificationSlide();

    // Log: Sidebar notification verified and closed
    cy.log("Sidebar notification verified and closed");

    // Sign out as Nurse and ensure login page is visible
    loginPage.ensureLoggedIn();
    loginPage.clickSignOutBtn();

    // Log: Test case completed
    cy.log("Test case 'Verify Notice Board Functionality' completed");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
