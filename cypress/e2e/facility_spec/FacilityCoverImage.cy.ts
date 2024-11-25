import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import FacilityManage from "../../pageobject/Facility/FacilityManage";

const roleUserFacilities = [
  { username: "devdistrictadmin", facilityName: "Dummy Facility 40" },
  { username: "devdoctor", facilityName: "Dummy Facility 4" },
];

roleUserFacilities.forEach(({ username, facilityName }) => {
  describe("Facility Cover Image Functionality", () => {
    const facilityManage = new FacilityManage();
    const facilityPage = new FacilityPage();

    before(() => {
      cy.loginByApi(username, "Coronasafe@123");
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
      // Check: Cancel button functionality
      facilityManage.clickCoverImage();
      facilityManage.clickCancelButton();
      facilityManage.verifyCoverImageModalClosed();
      // Check: upload an image, verifying the API response.
      facilityManage.clickCoverImage();
      facilityManage.verifyUploadButtonVisible();
      facilityManage.uploadCoverImage("facility-cover-image.jpg");
      facilityManage.clickSaveCoverImage();
      facilityManage.verifyCoverImageModalClosed();
      // //Check: Edit the current cover image by uploading a new one, and verify the API response.
      facilityManage.clickCoverImage();
      facilityManage.verifyUploadButtonVisible();
      facilityManage.uploadCoverImage("new-facility-cover-image.jpg");
      facilityManage.clickSaveCoverImage();
      facilityManage.verifyCoverImageModalClosed();
      //Check: Delete the existing cover image, confirming the API response.
      facilityManage.clickCoverImage();
      facilityManage.clickDeleteCoverImage();
    });

    afterEach(() => {
      cy.saveLocalStorage();
    });
  });
});
