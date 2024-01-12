// FacilityCreation
import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import FacilityHome from "../../pageobject/Facility/FacilityHome";
import ManageUserPage from "../../pageobject/Users/ManageUserPage";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import { UserPage } from "../../pageobject/Users/UserSearch";
import { AssetPagination } from "../../pageobject/Asset/AssetPagination";

describe("Facility Homepage Function", () => {
  const loginPage = new LoginPage();
  const facilityHome = new FacilityHome();
  const facilityPage = new FacilityPage();
  const manageUserPage = new ManageUserPage();
  const userPage = new UserPage();
  const assetPagination = new AssetPagination();
  const facilitiesAlias = "downloadFacilitiesCSV";
  const capacitiesAlias = "downloadCapacitiesCSV";
  const doctorsAlias = "downloadDoctorsCSV";
  const triagesAlias = "downloadTriagesCSV";
  const facilityname = "Dummy Facility 1";
  const statename = "Kerala";
  const district = "Ernakulam";
  const localbody = "Aikaranad";
  const facilitytype = "Private Hospital";

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/facility");
  });

  it("Verify the Facility card button redirection", () => {
    // view cns button
    facilityHome.clickViewCnsButton();
    facilityHome.verifyCnsUrl();
    facilityHome.navigateBack();
    // view notify button
    facilityHome.clickFacilityNotifyButton();
    facilityHome.verifyAndCloseNotifyModal();
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
    userPage.clickAdvancedFilters();
    facilityPage.selectState(statename);
    facilityPage.selectDistrict(district);
    facilityPage.selectLocalBody(localbody);
    facilityPage.clickUpdateFacilityType(facilitytype);
    userPage.applyFilter();
    facilityPage.verifyStateBadgeContent(statename);
    facilityPage.verifyDistrictBadgeContent(district);
    facilityPage.verifyLocalBodyBadgeContent(localbody);
    facilityPage.verifyFacilityTypeBadgeContent(facilitytype);
    manageUserPage.assertFacilityInCard(facilityname);
    userPage.clearFilters();
    userPage.verifyDataTestIdNotVisible("State");
    userPage.verifyDataTestIdNotVisible("District");
    userPage.verifyDataTestIdNotVisible("Facility type");
    userPage.verifyDataTestIdNotVisible("Local Body");
  });

  it("Search a facility in homepage and pagination", () => {
    // pagination of the facility page
    cy.clearAllFilters();
    assetPagination.navigateToNextPage();
    assetPagination.navigateToPreviousPage();
    // search for a facility
    manageUserPage.typeFacilitySearch(facilityname);
    facilityPage.verifyFacilityBadgeContent(facilityname);
    manageUserPage.assertFacilityInCard(facilityname);
    facilityHome.verifyURLContains(facilityname);
  });

  it("Verify Facility Export Functionality", () => {
    // Download the Facilities CSV
    facilityHome.csvDownloadIntercept(facilitiesAlias, "");
    facilityHome.clickExportButton();
    facilityHome.clickMenuItem("Facilities");
    facilityHome.verifyDownload(facilitiesAlias);
    facilityHome.clickSearchButton(); // to avoid flaky test, as sometimes, the test is unable to focus on the object
    // Download the Capacities CSV
    facilityHome.csvDownloadIntercept(capacitiesAlias, "&capacity");
    facilityHome.clickExportButton();
    facilityHome.clickMenuItem("Capacities");
    facilityHome.verifyDownload(capacitiesAlias);
    facilityHome.clickSearchButton();
    // Download the Doctors CSV
    facilityHome.csvDownloadIntercept(doctorsAlias, "&doctors");
    facilityHome.clickExportButton();
    facilityHome.clickMenuItem("Doctors");
    facilityHome.verifyDownload(doctorsAlias);
    facilityHome.clickSearchButton();
    // Download the Triages CSV
    facilityHome.csvDownloadIntercept(triagesAlias, "&triage");
    facilityHome.clickExportButton();
    facilityHome.clickMenuItem("Triages");
    facilityHome.verifyDownload(triagesAlias);
    facilityHome.clickSearchButton();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
