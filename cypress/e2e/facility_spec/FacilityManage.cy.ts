import FacilityHome from "pageobject/Facility/FacilityHome";
import { advanceFilters } from "pageobject/utils/advanceFilterHelpers";

import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import FacilityManage from "../../pageobject/Facility/FacilityManage";
import LoginPage from "../../pageobject/Login/LoginPage";

describe("Facility Manage Functions", () => {
  const loginPage = new LoginPage();
  const facilityManage = new FacilityManage();
  const facilityPage = new FacilityPage();
  const facilityHome = new FacilityHome();
  const facilityName = "Dummy Facility 40";
  const facilityMiddlewareUpdateButton = "Update";
  const facilityMiddleware = "dev-middleware.coronasafe.live";
  const facilityUpdatedMiddleware = "updated.coronasafe.live";
  const facilityMiddlewareSuccessfullNotification =
    "Facility middleware updated successfully";
  const facilityHfridUpdateButton = "Link Health Facility";
  const facilityHfridToastNotificationText =
    /Health Facility config updated successfully|Health ID registration failed/;
  const facilityHfrId = "IN180000018";
  const facilityUpdatedHfrId = "IN180000020";

  before(() => {
    loginPage.loginByRole("districtAdmin");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/");
    facilityHome.typeFacilitySearch(facilityName);
    advanceFilters.verifyFilterBadgePresence(
      "Facility/District Name",
      facilityName,
      true,
    );
    facilityPage.visitAlreadyCreatedFacility();
  });

  it("Facility Cover Image button functionality", () => {
    // It's only button functionality because we can't access S3 bucket in local
    facilityManage.clickCoverImage();
    facilityManage.verifyUploadButtonVisible();
    facilityManage.uploadCoverImage("facility-cover-image.jpg");
    facilityManage.clickSaveCoverImage();
  });

  it("Configure Facility Middleware", () => {
    facilityPage.clickManageFacilityDropdown();
    facilityManage.clickFacilityConfigureButton();
    facilityManage.verifyMiddlewareAddressVisible();
    // verify mandatory field error message
    facilityManage.clickButtonWithText(facilityMiddlewareUpdateButton);
    facilityManage.checkErrorMessageVisibility(
      "Middleware Address is required",
    );
    // add middleware and verify the notification
    facilityManage.typeMiddlewareAddress(facilityMiddleware);
    facilityManage.clickButtonWithText(facilityMiddlewareUpdateButton);
    facilityManage.verifySuccessMessageVisibilityAndContent(
      facilityMiddlewareSuccessfullNotification,
    );
    // update the existing middleware
    facilityPage.clickManageFacilityDropdown();
    facilityManage.clickFacilityConfigureButton();
    facilityManage.verifyMiddlewareAddressVisible();
    facilityManage.typeMiddlewareAddress(facilityUpdatedMiddleware);
    facilityManage.clickButtonWithText(facilityMiddlewareUpdateButton);
    facilityManage.verifySuccessMessageVisibilityAndContent(
      facilityMiddlewareSuccessfullNotification,
    );
    // verify the updated middleware
    facilityPage.clickManageFacilityDropdown();
    facilityManage.clickFacilityConfigureButton();
    facilityManage.verifyMiddlewareAddressValue(facilityUpdatedMiddleware);
  });

  it("Configure Facility Health ID", () => {
    facilityPage.clickManageFacilityDropdown();
    facilityManage.clickFacilityConfigureButton();
    // verify mandatory field error message
    facilityManage.clearHfrId();
    facilityManage.clickButtonWithText(facilityHfridUpdateButton);
    facilityManage.checkErrorMessageVisibility(
      "Health Facility Id is required",
    );
    // add facility health ID and verify notification
    facilityManage.typeHfrId(facilityHfrId);
    facilityManage.clickButtonWithText(facilityHfridUpdateButton);
    facilityManage.verifySuccessMessageVisibilityAndContent(
      facilityHfridToastNotificationText,
      true,
    );
    // update the existing middleware
    facilityPage.clickManageFacilityDropdown();
    facilityManage.clickFacilityConfigureButton();
    facilityManage.typeHfrId(facilityUpdatedHfrId);
    facilityManage.clickButtonWithText(facilityHfridUpdateButton);
    facilityManage.verifySuccessMessageVisibilityAndContent(
      facilityHfridToastNotificationText,
      true,
    );
    // verify its reflection
    facilityPage.clickManageFacilityDropdown();
    facilityManage.clickFacilityConfigureButton();
    facilityManage.verifyHfrIdValue(facilityUpdatedHfrId);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
