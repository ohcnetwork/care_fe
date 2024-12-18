// FacilityCreation
import FacilityLocation from "pageobject/Facility/FacilityLocation";
import { PatientPage } from "pageobject/Patient/PatientCreation";
import PatientPredefined from "pageobject/Patient/PatientPredefined";
import { pageNavigation } from "pageobject/utils/paginationHelpers";

import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import FacilityHome from "../../pageobject/Facility/FacilityHome";
import FacilityNotify from "../../pageobject/Facility/FacilityNotify";
import LoginPage from "../../pageobject/Login/LoginPage";
import ManageUserPage from "../../pageobject/Users/ManageUserPage";
import { advanceFilters } from "../../pageobject/utils/advanceFilterHelpers";

describe("Facility Homepage Function", () => {
  const loginPage = new LoginPage();
  const facilityHome = new FacilityHome();
  const facilityNotify = new FacilityNotify();
  const facilityPage = new FacilityPage();
  const manageUserPage = new ManageUserPage();
  const patientPredefined = new PatientPredefined();
  const patientPage = new PatientPage();
  const facilityLocation = new FacilityLocation();
  const facilitiesAlias = "downloadFacilitiesCSV";
  const facilityName = "Dummy Facility 40";
  const facilityLocaion = "Dummy Location";
  const stateName = "Kerala";
  const district = "Ernakulam";
  const localBody = "Aikaranad";
  const facilityType = "Private Hospital";
  const notificationErrorMsg = "Message cannot be empty";
  const notificationMessage = "Test Notification";
  const facilityWithNoAvailableBeds = "Dummy Facility 12";
  const locationName = "Test-location";
  const locationType = "WARD";

  before(() => {
    loginPage.loginByRole("districtAdmin");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/facility");
  });

  it("Verify the Facility card button redirection", () => {
    // view cns button
    facilityHome.typeFacilitySearch(facilityName);
    advanceFilters.verifyFilterBadgePresence(
      "Facility/District Name",
      facilityName,
      true,
    );
    facilityHome.assertFacilityInCard(facilityName);
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
    advanceFilters.verifyFilterBadgePresence("State", stateName, true);
    advanceFilters.verifyFilterBadgePresence("District", district, true);
    advanceFilters.verifyFilterBadgePresence(
      "Facility type",
      facilityType,
      true,
    );
    advanceFilters.verifyFilterBadgePresence("Local Body", localBody, true);
    facilityHome.assertFacilityInCard(facilityName);
    advanceFilters.clickAdvancedFiltersButton();
    advanceFilters.clickClearAdvanceFilters();
    advanceFilters.verifyFilterBadgePresence("State", "", false);
    advanceFilters.verifyFilterBadgePresence("District", "", false);
    advanceFilters.verifyFilterBadgePresence("Facility type", "", false);
    advanceFilters.verifyFilterBadgePresence("Local Body", "", false);
  });

  it("Search a facility in homepage and pagination", () => {
    // pagination of the facility page
    pageNavigation.navigateToNextPage();
    pageNavigation.verifyCurrentPageNumber(2);
    pageNavigation.navigateToPreviousPage();
    pageNavigation.verifyCurrentPageNumber(1);
    // search for a facility
    facilityHome.typeFacilitySearch(facilityName);
    advanceFilters.verifyFilterBadgePresence(
      "Facility/District Name",
      facilityName,
      true,
    );
    facilityHome.assertFacilityInCard(facilityName);
    facilityHome.verifyURLContains(facilityName);
  });

  it("Verify Facility Export Functionality", () => {
    // Verify Facility Export
    facilityHome.csvDownloadIntercept(facilitiesAlias, "");
    facilityHome.clickExportButton();
    facilityHome.verifyDownload(facilitiesAlias);
  });

  it("Verify Facility Detail page redirection to CNS and Live Minitoring  ", () => {
    advanceFilters.clickAdvancedFiltersButton();
    advanceFilters.selectState(stateName);
    advanceFilters.selectDistrict(district);
    advanceFilters.selectLocalBody(localBody);
    advanceFilters.applySelectedFilter();
    // go to cns page in the facility details page
    facilityHome.typeFacilitySearch(facilityName);
    advanceFilters.verifyFilterBadgePresence(
      "Facility/District Name",
      facilityName,
      true,
    );
    facilityHome.assertFacilityInCard(facilityName);
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
    facilityHome.interceptFacilitySearchReq();
    facilityHome.typeFacilitySearch(facilityName);
    facilityHome.verifyFacilitySearchReq();
    // verify facility name and card reflection
    facilityNotify.verifyUrlContains("Dummy+Facility+40");
    advanceFilters.verifyFilterBadgePresence(
      "Facility/District Name",
      facilityName,
      true,
    );
    facilityHome.assertFacilityInCard(facilityName);
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
    cy.clickCancelButton("Cancel");
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
    loginPage.loginManuallyAsDistrictAdmin();
    loginPage.ensureLoggedIn();
  });

  it("Verify the bed capacity badge reflection", () => {
    facilityHome.interceptFacilitySearchReq();
    facilityHome.typeFacilitySearch(facilityWithNoAvailableBeds);
    facilityHome.verifyFacilitySearchReq();
    facilityHome.assertFacilityInCard(facilityWithNoAvailableBeds);
    cy.url().then((url) => {
      const facilityUrl = url.toString();
      facilityHome.verifyOccupancyBadgeVisibility();
      facilityHome.assertFacilityBadgeContent("0", "0");

      // create a new patient in the facility
      cy.visit("/patients");
      patientPage.createPatient();
      patientPage.selectFacility(facilityWithNoAvailableBeds);
      patientPredefined.createPatient();
      patientPage.patientformvisibility();
      patientPage.clickCreatePatient();
      patientPage.verifyPatientIsCreated();
      // navigate to facility page and verify the occupancy badge
      cy.visit(facilityUrl);
      facilityHome.verifyOccupancyBadgeVisibility();
      facilityHome.assertFacilityBadgeContent("1", "0");
      facilityHome.assertFacilityBadgeBackgroundColor("rgb(239, 68, 68)");
      // create a new location and add a bed to the facility
      facilityLocation.navigateToFacilityLocationManagement(
        facilityWithNoAvailableBeds,
      );
      // create new location and add a bed to the facility
      facilityLocation.clickAddNewLocationButton();
      facilityLocation.fillLocationDetails(
        locationName,
        undefined,
        locationType,
        undefined,
      );
      facilityLocation.clickAddLocationButton();
      facilityLocation.verifyAddLocationSuccessfulMesssage();
      facilityLocation.clickManageBedButton(locationName);
      facilityLocation.clickAddBedButton();
      facilityLocation.fillBedForm("Bed 1", "Test Description", "Regular", 2);
      facilityLocation.clickSubmitBedsButton();

      // verify the occupancy badge reflection
      cy.visit(facilityUrl);
      facilityHome.verifyOccupancyBadgeVisibility();
      facilityHome.assertFacilityBadgeContent("1", "2");
    });
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
