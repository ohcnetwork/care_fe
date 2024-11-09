import { v4 as uuidv4 } from "uuid";

import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import FacilityManage from "../../pageobject/Facility/FacilityManage";
import LoginPage from "../../pageobject/Login/LoginPage";

describe("Facility Manage Functions", () => {
  const loginPage = new LoginPage();
  const facilityManage = new FacilityManage();
  const facilityPage = new FacilityPage();
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
  const facilityUpdatedHfrId = uuidv4();
  const doctorCapacity = "5";
  const doctorModifiedCapacity = "7";
  const totalCapacity = "100";
  const currentOccupied = "80";
  const totalUpdatedCapacity = "120";
  const currentUpdatedOccupied = "100";

  before(() => {
    loginPage.loginAsDistrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/");
    facilityPage.typeFacilitySearch(facilityName);
    facilityPage.verifyFacilityBadgeContent(facilityName);
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

  it("Modify doctor capacity in Facility detail page", () => {
    // Add a doctor capacity
    facilityManage.clickFacilityAddDoctorTypeButton();
    facilityPage.selectAreaOfSpecialization("Pulmonology");
    facilityPage.fillDoctorCount(doctorCapacity);
    facilityPage.saveAndExitDoctorForm();
    facilityManage.verifySuccessMessageVisibilityAndContent(
      "Staff count added successfully",
    );
    facilityManage.verifyTotalDoctorCapacity(doctorCapacity);
    // edit a existing doctor
    facilityManage.clickEditFacilityDoctorCapacity();
    facilityPage.fillDoctorCount(doctorModifiedCapacity);
    facilityPage.clickdoctorcapacityaddmore();
    facilityManage.verifySuccessMessageVisibilityAndContent(
      "Staff count updated successfully",
    );
    facilityManage.verifyTotalDoctorCapacity(doctorModifiedCapacity);
    // delete a bed
    facilityManage.clickDeleteFacilityDoctorCapacity();
    facilityManage.clickButtonWithText("Delete");
    facilityManage.verifySuccessMessageVisibilityAndContent(
      "Staff specialization type deleted successfully",
    );
  });

  it("Modify bed capacity in Facility detail page", () => {
    // add multiple new bed capacity
    facilityManage.clickFacilityAddBedTypeButton();
    facilityPage.selectBedType("Isolation Bed");
    facilityPage.fillTotalCapacity(totalCapacity);
    facilityPage.fillCurrentlyOccupied(currentOccupied);
    facilityPage.saveAndExitBedCapacityForm();
    facilityManage.verifySuccessMessageVisibilityAndContent(
      "Bed capacity added successfully",
    );
    cy.closeNotification();
    facilityManage.verifyFacilityBedCapacity(totalCapacity);
    facilityManage.verifyFacilityBedCapacity(currentOccupied);
    // edit a existing bed
    facilityManage.clickEditFacilityBedCapacity();
    facilityPage.fillTotalCapacity(totalUpdatedCapacity);
    facilityPage.fillCurrentlyOccupied(currentUpdatedOccupied);
    facilityPage.clickbedcapcityaddmore();
    facilityManage.verifySuccessMessageVisibilityAndContent(
      "Bed capacity updated successfully",
    );
    cy.closeNotification();
    facilityManage.verifyFacilityBedCapacity(totalUpdatedCapacity);
    facilityManage.verifyFacilityBedCapacity(currentUpdatedOccupied);
    // delete a bed
    facilityManage.clickDeleteFacilityBedCapacity();
    facilityManage.clickButtonWithText("Delete");
    facilityManage.verifySuccessMessageVisibilityAndContent(
      "Bed type deleted successfully",
    );
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
