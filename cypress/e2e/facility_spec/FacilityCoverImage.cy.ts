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

describe("Facility Image Upload Functionality", () => {
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

    it(`Upload and Verify Image Upload Functionality as ${role}`, () => {
      facilityManage.clickCoverImage();
      facilityManage.verifyUploadButtonVisible();
      facilityManage.clickCancelCoverImage();
      facilityManage.interceptImageUploadRequest();
      facilityManage.clickCoverImage();
      facilityManage.uploadCoverImage("facility-cover-image.jpg");
      facilityManage.clickSaveCoverImage();
      facilityManage.verifySuccessMessageVisibilityAndContent(
        successUploadNotificationText,
      );
      facilityManage.verifyImageUploadRequest();
      facilityManage.interceptImageUploadRequest();
      facilityManage.clickCoverImage();
      facilityManage.uploadCoverImage("facility-cover-image.jpg");
      facilityManage.clickSaveCoverImage();
      facilityManage.verifyImageUploadRequest();
      facilityManage.verifySuccessMessageVisibilityAndContent(
        successUploadNotificationText,
      );
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
