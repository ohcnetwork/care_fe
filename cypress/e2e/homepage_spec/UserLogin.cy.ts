import LoginPage from "pageobject/Login/LoginPage";

const loginPage = new LoginPage();

describe("Authorisation/Authentication", () => {
  beforeEach(() => {
    cy.awaitUrl("/", true);
  });

  it("Try login as admin with correct password", () => {
    loginPage.loginManuallyAsDistrictAdmin();
    loginPage.interceptFacilityReq();
    loginPage.verifyFacilityReq();
    loginPage.ensureLoggedIn();
    loginPage.clickSignOutBtn();
    loginPage.verifyLoginPageUrl();
  });

  it("Try login as admin with incorrect password", () => {
    loginPage.interceptLoginReq();
    loginPage.loginManuallyAsDistrictAdmin(false);
    loginPage.verifyLoginReq();
    cy.verifyNotification("No active account found with the given credentials");
  });
});

describe("Forgot Password", () => {
  const userName = "dummy_user_1";
  beforeEach(() => {
    cy.awaitUrl("/", true);
  });

  it("should send a password reset link and navigate back to the login page", () => {
    cy.verifyAndClickElement("#forgot-pass-btn", "Forgot password?");
    loginPage.fillUserNameInForgotPasswordForm(userName);
    loginPage.interceptResetLinkReq();
    loginPage.clickSendResetLinkBtn();
    loginPage.verifyResetLinkReq();
    cy.verifyNotification("Password Reset Email Sent");
    loginPage.clickBackButton();
    loginPage.verifyLoginPageUrl();
  });
});
