import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import FacilityManage from "../../pageobject/Facility/FacilityManage";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";

describe("Facility Manage Functions", () => {
  const loginPage = new LoginPage();
  const facilityManage = new FacilityManage();
  const facilityPage = new FacilityPage();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/");
    facilityPage.visitAlreadyCreatedFacility();
  });

  it("Facility Cover Image button functionality", () => {
    // It's only button functionality because we can't access S3 bucket in local
    facilityManage.clickCoverImage();
    facilityManage.verifyUploadButtonVisible();
    facilityManage.uploadCoverImage("facilitycoverimage.jpg");
    facilityManage.clickSaveCoverImage();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
