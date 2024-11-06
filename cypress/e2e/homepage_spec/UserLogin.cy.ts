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
    cy.verifyAndClickElement("#forgot-pass-btn", "Forgot password?");
  });

  it("Send Password Reset Link", () => {
    loginPage.fillUserNameInForgotPasswordForm(userName);
    loginPage.interceptResetLinkReq();
    loginPage.clickSendResetLinkBtn();
    loginPage.verifyResetLinkReq();
    cy.verifyNotification("Password Reset Email Sent");
  });

  it("Go to Login page", () => {
    loginPage.clickBackButton();
    loginPage.verifyLoginPageUrl();
  });
});
