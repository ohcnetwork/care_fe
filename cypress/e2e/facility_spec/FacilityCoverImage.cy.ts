import FacilityPage from "pageobject/Facility/FacilityCreation";
import FacilityHome from "pageobject/Facility/FacilityHome";
import FacilityManage from "pageobject/Facility/FacilityManage";
import LoginPage from "pageobject/Login/LoginPage";
import { users } from "pageobject/utils/userConfig";

interface IRoleAndFacility {
  role: keyof typeof users;
  facilityName: string;
}

const rolesAndFacility: IRoleAndFacility[] = [
  {
    role: "districtAdmin",
    facilityName: "Dummy Facility 40",
  },
  {
    role: "devDoctor",
    facilityName: "Dummy Facility 4",
  },
];

describe("Facility Cover Image Upload Functionality", () => {
  const loginPage = new LoginPage();
  const facilityPage = new FacilityPage();
  const facilityHome = new FacilityHome();
  const facilityManage = new FacilityManage();
  const successUploadNotificationText = "Cover image updated.";

  rolesAndFacility.forEach(({ role, facilityName }) => {
    before(() => {
      loginPage.loginByRole(role);
      cy.saveLocalStorage();
    });

    beforeEach(() => {
      cy.viewport(1920, 1080);
      cy.restoreLocalStorage();
      cy.clearLocalStorage(/filters--.+/);
      cy.awaitUrl("/");
      facilityHome.typeFacilitySearch(facilityName);
      facilityPage.visitAlreadyCreatedFacility();
    });

    it(`Upload and Verify Cover Image Upload Functionality Role:${role}`, () => {
      // Test Visibility of Pop-up
      facilityManage.clickCoverImage();
      facilityManage.verifyUploadButtonVisible();
      facilityManage.clickCancelCoverImage();
      // Test Functionality of Upload Cover Image
      facilityManage.interceptImageUploadRequest();
      facilityManage.clickCoverImage();
      facilityManage.uploadCoverImage("facility-cover-image.jpg");
      facilityManage.clickSaveCoverImage();
      facilityManage.verifyImageUploadRequest();
      facilityManage.verifySuccessMessageVisibilityAndContent(
        successUploadNotificationText,
      );
      // Test Edit Cover Image Functionality
      facilityManage.interceptImageUploadRequest();
      facilityManage.clickCoverImage();
      facilityManage.uploadCoverImage("facility-cover-image-1.jpg");
      facilityManage.clickSaveCoverImage();
      facilityManage.verifyImageUploadRequest();
      facilityManage.verifySuccessMessageVisibilityAndContent(
        successUploadNotificationText,
      );
      // Test Delete Cover Image Functionality
      facilityManage.clickCoverImage();
      facilityManage.interceptImageDeleteRequest();
      facilityManage.clickDeleteCoverImage();
      facilityManage.verifyImageDeleteRequest();
    });

    afterEach(() => {
      cy.saveLocalStorage();
    });
  });
});
