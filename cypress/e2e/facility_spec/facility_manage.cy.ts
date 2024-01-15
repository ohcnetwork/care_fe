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
    cy.get("#configure-facility").should("be.visible");
    cy.get("#configure-facility").click();
    cy.get("#middleware_address").should("be.visible");
    // verify mandatory field error message
    cy.get("button#submit").contains("Update").click();
    cy.get(".error-text")
      .contains("Middleware Address is required")
      .should("be.visible");
    // add middleware and verify the notification
    cy.get("#middleware_address")
      .click()
      .clear()
      .click()
      .type("dev-middlreware.coronasafe.live");
    cy.get("button#submit").contains("Update").click();
    cy.get(".pnotify-text")
      .should("be.visible")
      .and("contain", "Facility updated successfully");
    // update the existing middleware
    facilityPage.clickManageFacilityDropdown();
    cy.get("#configure-facility").should("be.visible");
    cy.get("#configure-facility").click();
    cy.get("#middleware_address").should("be.visible");
    cy.get("#middleware_address")
      .click()
      .clear()
      .click()
      .type("updated.coronasafe.live");
    cy.get("button#submit").contains("Update").click();
    cy.get(".pnotify-text")
      .should("be.visible")
      .and("contain", "Facility updated successfully");
    // verify the updated middleware
    facilityPage.clickManageFacilityDropdown();
    cy.get("#configure-facility").should("be.visible");
    cy.get("#configure-facility").click();
    cy.get("#middleware_address").should(
      "have.value",
      "updated.coronasafe.live"
    );
  });

  it("Configure Facility Health ID", () => {
    facilityPage.clickManageFacilityDropdown();
    cy.get("#configure-facility").should("be.visible");
    cy.get("#configure-facility").click();
    // verify mandatory field error message
    cy.get("button#submit").contains("Link Health Facility").click();
    cy.get(".error-text")
      .contains("Health Facility Id is required")
      .should("be.visible");
    // add facility health ID and verify notification
    cy.get("#hf_id").click().clear().click().type(hrf_id_1);
    cy.get("button#submit").contains("Link Health Facility").click();
    cy.get(".pnotify-text")
      .should("be.visible")
      .and("contain", "Health Facility config updated successfully");
    // update the existing middleware
    facilityPage.clickManageFacilityDropdown();
    cy.get("#configure-facility").should("be.visible");
    cy.get("#configure-facility").click();
    cy.get("#hf_id").click().clear().click().type(hrf_id_2);
    cy.get("button#submit").contains("Link Health Facility").click();
    cy.get(".pnotify-text")
      .should("be.visible")
      .and("contain", "Health Facility config updated successfully");
    // verify its reflection
    facilityPage.clickManageFacilityDropdown();
    cy.get("#configure-facility").should("be.visible");
    cy.get("#configure-facility").click();
    cy.get("#hf_id").should("have.value", hrf_id_2);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
