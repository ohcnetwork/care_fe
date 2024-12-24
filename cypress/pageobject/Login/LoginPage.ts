import { users } from "../utils/userConfig";

class LoginPage {
  loginByRole(role: keyof typeof users): void {
    const user = users[role];
    if (!user) {
      throw new Error(`Role "${role}" is not defined in userConfig`);
    }
    cy.loginByApi(user.username, user.password);
  }

  loginManuallyAsDistrictAdmin(isCorrectCredentials: boolean = true): void {
    cy.get("input[id='username']").type("devdistrictadmin");
    if (isCorrectCredentials) {
      cy.get("input[id='password']").type("Coronasafe@123");
    } else {
      cy.get("input[id='password']").type("Corona");
    }
    cy.clickSubmitButton("Login");
  }

  loginManuallyAsNurse(password?: string): void {
    cy.get("input[id='username']").click().type("dummynurse1");
    cy.get("input[id='password']")
      .click()
      .type(password || "Coronasafe@123");
    cy.clickSubmitButton("Login");
  }

  ensureLoggedIn(): void {
    cy.get("#user-profile-name").click();
    cy.get("#sign-out-button").scrollIntoView();
    cy.get("#sign-out-button").contains("Sign Out").should("exist");
  }

  clickSignOutBtn(): void {
    cy.verifyAndClickElement("#sign-out-button", "Sign Out");
  }

  fillUserNameInForgotPasswordForm(userName: string): void {
    cy.get("#forgot_username").type(userName);
  }

  clickSendResetLinkBtn(): void {
    cy.verifyAndClickElement("#send-reset-link-btn", "Send Reset Link");
  }

  verifyLoginPageUrl(): void {
    cy.url().should("include", "/");
  }

  clickBackButton(): void {
    cy.verifyAndClickElement("#back-to-login-btn", "Back to login");
  }

  clickForgotPasswordButton(text: string): void {
    cy.verifyAndClickElement("#forgot-pass-btn", text);
  }

  interceptFacilityReq(): void {
    cy.intercept("GET", "**/api/v1/facility/**").as("getFacilities");
  }

  verifyFacilityReq(): void {
    cy.wait("@getFacilities").its("response.statusCode").should("eq", 200);
  }

  interceptLoginReq(): void {
    cy.intercept("POST", "**/api/v1/auth/login").as("userLogin");
  }

  verifyLoginReq(): void {
    cy.wait("@userLogin").its("response.statusCode").should("eq", 401);
  }

  interceptResetLinkReq(): void {
    cy.intercept("POST", "**/api/v1/password_reset").as("resetLink");
  }

  verifyResetLinkReq(): void {
    cy.wait("@resetLink").its("response.statusCode").should("eq", 200);
  }

  verifyLoginButtonPresence(): void {
    cy.verifyContentPresence("#login-button", ["Login"]);
  }

  verifyForgotPasswordHeading(text: string[]): void {
    cy.verifyContentPresence("#forgot-password-heading", text);
  }
}

export default LoginPage;
