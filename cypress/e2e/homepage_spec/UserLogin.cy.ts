import LoginPage from "pageobject/Login/LoginPage";

const loginPage = new LoginPage();
const userName = "dummy_user_1";
const forgotPasswordHeading = "Forgot password?";

describe("User login workflow with correct and incorrect passwords", () => {
  beforeEach(() => {
    cy.awaitUrl("/", true);
  });

  it("Log in as admin with correct password", () => {
    loginPage.loginManuallyAsDistrictAdmin();
    loginPage.interceptFacilityReq();
    loginPage.verifyFacilityReq();
    loginPage.ensureLoggedIn();
    loginPage.clickSignOutBtn();
    loginPage.verifyLoginPageUrl();
  });

  it("Display an error when logging in as admin with incorrect password", () => {
    loginPage.interceptLoginReq();
    loginPage.loginManuallyAsDistrictAdmin(false);
    loginPage.verifyLoginReq();
    cy.verifyNotification("No active account found with the given credentials");
    cy.closeNotification();
  });
});

describe("Reset user's password using email", () => {
  beforeEach(() => {
    cy.awaitUrl("/", true);
  });

  it("Send a password reset link and navigate back to the login page", () => {
    loginPage.clickForgotPasswordButton(forgotPasswordHeading);
    loginPage.verifyForgotPasswordHeading([forgotPasswordHeading]);
    loginPage.fillUserNameInForgotPasswordForm(userName);
    loginPage.interceptResetLinkReq();
    loginPage.clickSendResetLinkBtn();
    loginPage.verifyResetLinkReq();
    cy.verifyNotification("Password Reset Email Sent");
    cy.closeNotification();
    loginPage.clickBackButton();
    loginPage.verifyLoginPageUrl();
    loginPage.verifyLoginButtonPresence();
  });
});
