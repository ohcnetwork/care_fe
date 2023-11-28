// FacilityCreation
import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import FacilityHome from "../../pageobject/Facility/FacilityHome";
import ManageUserPage from "../../pageobject/Users/ManageUserPage";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";

describe("Facility Creation", () => {
  const loginPage = new LoginPage();
  const facilityHome = new FacilityHome();
  const facilityPage = new FacilityPage();
  const manageUserPage = new ManageUserPage();
  const facilitiesAlias = "downloadFacilitiesCSV";
  const capacitiesAlias = "downloadCapacitiesCSV";
  const doctorsAlias = "downloadDoctorsCSV";
  const triagesAlias = "downloadTriagesCSV";
  const facilityname = "Dummy Facility 1";

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/facility");
  });

  it("Search a facility in homepage", () => {
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
