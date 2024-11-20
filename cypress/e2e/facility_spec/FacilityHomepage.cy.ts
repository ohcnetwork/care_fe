// FacilityCreation
import { AssetPage } from "pageobject/Asset/AssetCreation";
import FacilityLocation from "pageobject/Facility/FacilityLocation";
import { PatientConsultationPage } from "pageobject/Patient/PatientConsultation";
import { PatientData, PatientPage } from "pageobject/Patient/PatientCreation";
import PatientTreatmentPlan from "pageobject/Patient/PatientTreatmentPlan";
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
  const patientPage = new PatientPage();
  const patientConsultationPage = new PatientConsultationPage();
  const patientTreatmentPlan = new PatientTreatmentPlan();
  const facilityLocation = new FacilityLocation();
  const assetPage = new AssetPage();
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
  const doctorName = "Dummy Doctor";
  const facilityWithNoAvailableBeds = "Dummy Facility 12";
  const usernameToLinkFacilityWithNoBeds = "dummydoctor12";
  const newPatientData: PatientData = {
    facility: facilityWithNoAvailableBeds,
    phoneNumber: "9898464555",
    isEmergencyNumber: true,
    age: "20",
    name: "Dummy Patient Fourty Two",
    gender: "Male",
    address: "42 is the answer to everything",
    pincode: "682001",
    state: "Kerala",
    district: "Ernakulam",
    localBody: "Aluva",
    ward: "4",
    occupation: "Student",
    socioeconomicStatus: "MIDDLE_CLASS",
    domesticHealthcareSupport: "FAMILY_MEMBER",
    medicalHistory: {
      presentHealth: "Good",
      ongoingMedication: "None",
      conditions: [{ index: 2, condition: "Diabetes" }],
      allergies: "None",
    },
    bloodGroup: "O+",
  };
  const patientIpNumber = `${Math.floor(Math.random() * 90 + 10)}/${Math.floor(Math.random() * 9000 + 1000)}`;
  const locationName = "Test-location";
  const locationType = "WARD";

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
    loginPage.loginManuallyAsDistrictAdmin();
    loginPage.ensureLoggedIn();
  });

  it("Verify the bed capacity badge reflection", () => {
    manageUserPage.typeFacilitySearch(facilityWithNoAvailableBeds);
    facilityPage.verifyFacilityBadgeContent(facilityWithNoAvailableBeds);
    manageUserPage.assertFacilityInCard(facilityWithNoAvailableBeds);
    facilityHome.verifyOccupancyBadgeVisibility();
    manageUserPage.assertFacilityBadgeContent("0", "0");

    // link dummy doctor 12 to the facility
    cy.awaitUrl("/users");
    userPage.typeInSearchInput(usernameToLinkFacilityWithNoBeds);
    userPage.checkUsernameText(usernameToLinkFacilityWithNoBeds);

    cy.get("#home_facility").then(($homeFacility) => {
      const homeFacilityText = $homeFacility.text().trim();
      if (homeFacilityText.includes("No Home Facility")) {
        // Link facility if no home facility exists
        manageUserPage.clickFacilitiesTab();
        manageUserPage.selectFacilityFromDropdown(facilityWithNoAvailableBeds);
        manageUserPage.clickLinkFacility();
        manageUserPage.clickHomeFacilityIcon();
        manageUserPage.assertnotLinkedFacility(facilityWithNoAvailableBeds);
        manageUserPage.assertHomeFacilitylink(facilityWithNoAvailableBeds);
        manageUserPage.clickCloseSlideOver();
      } else {
        // Assert if facility is already linked
        manageUserPage.assertHomeFacility(facilityWithNoAvailableBeds);
      }
    });

    // create a new patient in the facility
    cy.visit("/patients");
    patientPage.createPatientWithData(newPatientData);
    // navigate to facility page and verify the occupancy badge
    cy.visit("/facility");
    manageUserPage.typeFacilitySearch(facilityWithNoAvailableBeds);
    facilityPage.verifyFacilityBadgeContent(facilityWithNoAvailableBeds);
    facilityHome.verifyOccupancyBadgeVisibility();
    manageUserPage.assertFacilityBadgeContent("1", "0");
    manageUserPage.assertFacilityBadgeBackgroundColor("rgb(239, 68, 68)");
    // create a new location and add a bed to the facility
    facilityPage.visitAlreadyCreatedFacility();
    cy.get("[id='manage-facility-dropdown']").scrollIntoView().click();
    cy.get("[id=location-management]").click();
    // create new location and add a bed to the facility
    cy.get("body").then(($body) => {
      if ($body.find("#manage-bed-button").length > 0) {
        facilityLocation.clickManageBedButton();
      } else {
        facilityLocation.clickAddNewLocationButton();
        facilityPage.fillFacilityName(locationName);
        facilityLocation.selectLocationType(locationType);
        assetPage.clickassetupdatebutton();
        facilityLocation.clickNotification();
        facilityLocation.clickManageBedButton();
      }
    });
    facilityLocation.clickAddBedButton();
    facilityLocation.addBed("Bed 1", "Test Description", "Regular", 2);
    // navigate to patient page, and click create consultation
    cy.visit("/facility");
    manageUserPage.typeFacilitySearch(facilityWithNoAvailableBeds);
    facilityPage.verifyFacilityBadgeContent(facilityWithNoAvailableBeds);
    // visit facility patients page
    manageUserPage.clickFacilityPatients();
    facilityHome.verifyPatientListVisibility();
    facilityHome.verifyPatientListUrl();
    // type patient name and click create consultation
    patientPage.visitPatientWithNoConsultation(newPatientData.name);
    // create patient consultation and add bed to the consultation
    patientConsultationPage.selectConsultationStatus(
      "Outpatient/Emergency Room",
    );
    cy.get("#is_asymptomatic").click();
    patientConsultationPage.selectPatientCategory("Mild");
    patientConsultationPage.typePatientNumber(patientIpNumber);
    patientConsultationPage.selectPatientDiagnosis(
      "1A00",
      "add-icd11-diagnosis-as-unconfirmed",
    );
    patientTreatmentPlan.fillTreatingPhysician(doctorName);
    patientConsultationPage.selectBed("Bed 1");
    cy.clickSubmitButton("Create Consultation");
    cy.verifyNotification("Consultation created successfully");
    // verify the occupancy badge reflection
    cy.visit("/facility");
    manageUserPage.typeFacilitySearch(facilityWithNoAvailableBeds);
    facilityPage.verifyFacilityBadgeContent(facilityWithNoAvailableBeds);
    facilityHome.verifyOccupancyBadgeVisibility();
    manageUserPage.assertFacilityBadgeContent("1", "2");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
