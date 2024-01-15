import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import FacilityManage from "../../pageobject/Facility/FacilityManage";

describe("Facility Manage Functions", () => {
  const loginPage = new LoginPage();
  const facilityManage = new FacilityManage();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/");
    cy.intercept("GET", "**/api/v1/facility/**").as("getFacilities");
    cy.get("[id='facility-details']").first().click();
    cy.wait("@getFacilities").its("response.statusCode").should("eq", 200);
    cy.get("h1.text-3xl.font-bold", { timeout: 10000 }).should("be.visible");
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
