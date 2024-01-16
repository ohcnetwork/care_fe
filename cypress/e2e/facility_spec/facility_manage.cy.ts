import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import FacilityManage from "../../pageobject/Facility/FacilityManage";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import { v4 as uuidv4 } from "uuid";

describe("Facility Manage Functions", () => {
  const loginPage = new LoginPage();
  const facilityManage = new FacilityManage();
  const facilityPage = new FacilityPage();
  const hrf_id_1 = uuidv4();
  const hrf_id_2 = uuidv4();

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

  it("Configure Facility Middleware", () => {
    facilityPage.clickManageFacilityDropdown();
    facilityManage.clickFacilityConfigureButton();
    facilityManage.verifyMiddlewareAddressVisible();
    // verify mandatory field error message
    facilityManage.clickButtonWithText("Update");
    facilityManage.checkErrorMessageVisibility(
      "Middleware Address is required"
    );
    // add middleware and verify the notification
    facilityManage.typeMiddlewareAddress("dev-middlreware.coronasafe.live");
    facilityManage.clickButtonWithText("Update");
    facilityManage.verifySuccessMessageVisibilityAndContent(
      "Facility updated successfully"
    );
    // update the existing middleware
    facilityPage.clickManageFacilityDropdown();
    facilityManage.clickFacilityConfigureButton();
    facilityManage.verifyMiddlewareAddressVisible();
    facilityManage.typeMiddlewareAddress("updated.coronasafe.live");
    facilityManage.clickButtonWithText("Update");
    facilityManage.verifySuccessMessageVisibilityAndContent(
      "Facility updated successfully"
    );
    // verify the updated middleware
    facilityPage.clickManageFacilityDropdown();
    facilityManage.clickFacilityConfigureButton();
    facilityManage.verifyMiddlewareAddressValue("updated.coronasafe.live");
  });

  it("Configure Facility Health ID", () => {
    facilityPage.clickManageFacilityDropdown();
    facilityManage.clickFacilityConfigureButton();
    // verify mandatory field error message
    facilityManage.clickButtonWithText("Link Health Facility");
    facilityManage.checkErrorMessageVisibility(
      "Health Facility Id is required"
    );
    // add facility health ID and verify notification
    facilityManage.typeHrfId(hrf_id_1);
    facilityManage.clickButtonWithText("Link Health Facility");
    facilityManage.verifySuccessMessageVisibilityAndContent(
      "Health Facility config updated successfully"
    );
    // update the existing middleware
    facilityPage.clickManageFacilityDropdown();
    facilityManage.clickFacilityConfigureButton();
    facilityManage.typeHrfId(hrf_id_2);
    facilityManage.clickButtonWithText("Link Health Facility");
    facilityManage.verifySuccessMessageVisibilityAndContent(
      "Health Facility config updated successfully"
    );
    // verify its reflection
    facilityPage.clickManageFacilityDropdown();
    facilityManage.clickFacilityConfigureButton();
    facilityManage.verifyHrfIdValue(hrf_id_2);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
