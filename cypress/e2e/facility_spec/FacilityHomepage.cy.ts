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
    // search facility and verify it's loaded or not
    manageUserPage.interceptFacilitySearchReq();
    manageUserPage.typeFacilitySearch(facilityName);
    manageUserPage.verifyFacilitySearchReq();
    // verify facility name and card reflection
    facilityNotify.verifyUrlContains("Dummy+Facility+40");
    facilityPage.verifyFacilityBadgeContent(facilityName);
    manageUserPage.assertFacilityInCard(facilityName);
    // send notification to a facility
    facilityHome.clickFacilityNotifyButton();
    facilityNotify.verifyFacilityName(facilityName);
    facilityNotify.fillNotifyText(notificationMessage);
    facilityNotify.interceptPostNotificationReq();
    cy.clickSubmitButton("Notify");
    facilityNotify.verifyPostNotificationReq();
    cy.verifyNotification("Facility Notified");
    cy.closeNotification();
    cy.wait(2000);
    // Verify the frontend error on empty message
    facilityHome.clickFacilityNotifyButton();
    facilityNotify.verifyFacilityName(facilityName);
    cy.clickSubmitButton("Notify");
    facilityNotify.verifyErrorMessage(notificationErrorMsg);
    // close pop-up and verify
    facilityHome.verifyAndCloseNotifyModal();
    // signout as district admin and login as a Nurse
    loginPage.ensureLoggedIn();
    loginPage.clickSignOutBtn();
    loginPage.loginManuallyAsNurse();
    // Verify Notice Board Reflection
    facilityNotify.interceptGetNotificationReq("MESSAGE");
    facilityNotify.visitNoticeBoard();
    facilityNotify.verifyGetNotificationReq();
    facilityNotify.verifyFacilityNoticeBoardMessage(notificationMessage);
    facilityNotify.interceptGetNotificationReq();
    // Verify Sidebar Notification Reflection
    facilityNotify.openNotificationSlide();
    facilityNotify.verifyGetNotificationReq();
    cy.verifyContentPresence("#notification-slide-msg", [notificationMessage]);
    facilityNotify.closeNotificationSlide();
    loginPage.ensureLoggedIn();
    loginPage.clickSignOutBtn();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
