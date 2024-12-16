import FacilityHome from "pageobject/Facility/FacilityHome";

import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import LoginPage from "../../pageobject/Login/LoginPage";
import ResourcePage from "../../pageobject/Resource/ResourcePage";

describe("Resource Page", () => {
  let createdResource: string;
  const loginPage = new LoginPage();
  const resourcePage = new ResourcePage();
  const facilityPage = new FacilityPage();
  const facilityHome = new FacilityHome();
  const phone_number = "9999999999";

  before(() => {
    loginPage.loginByRole("districtAdmin");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
  });

  it("Checks if all download button works", () => {
    resourcePage.navigationToResourcePage();
    resourcePage.verifyDownloadButtonWorks();
  });

  it("Switch between active/completed", () => {
    resourcePage.navigationToResourcePage();
    resourcePage.spyResourceApi();
    resourcePage.clickCompletedResources();
    resourcePage.verifyCompletedResources();
    resourcePage.spyResourceApi();
    resourcePage.clickActiveResources();
    resourcePage.verifyActiveResources();
  });

  it("Switch between list view and board view", () => {
    resourcePage.navigationToResourcePage();
    resourcePage.clickListViewButton();
    resourcePage.clickBoardViewButton();
  });

  it("Create a resource request", () => {
    facilityHome.navigateToFacilityHomepage();
    facilityHome.typeFacilitySearch("dummy facility 40");
    cy.intercept("GET", "**/api/v1/facility/**").as("loadFacilities");
    cy.get("#facility-details").click();
    cy.wait("@loadFacilities").its("response.statusCode").should("eq", 200);
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickResourceRequestOption();
    facilityPage.fillResourceRequestDetails(
      "Test User",
      phone_number,
      "Dummy",
      "Test title",
      "10",
      "Test description",
    );
    facilityPage.clickSubmitRequestButton();
    facilityPage.verifySuccessNotification(
      "Resource request created successfully",
    );
    facilityPage.verifyresourcenewurl();
    cy.url().then((url) => {
      createdResource = url;
    });
  });

  it("Update the status of resource", () => {
    cy.awaitUrl(createdResource);
    resourcePage.clickUpdateStatus();
    resourcePage.updateStatus("APPROVED");
    resourcePage.clickSubmitButton();
    resourcePage.verifySuccessNotification(
      "Resource request updated successfully",
    );
  });

  it("Post comment for a resource", () => {
    cy.awaitUrl(createdResource);
    resourcePage.addCommentForResource("Test comment");
    resourcePage.clickPostCommentButton();
    resourcePage.verifySuccessNotification("Comment added successfully");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
