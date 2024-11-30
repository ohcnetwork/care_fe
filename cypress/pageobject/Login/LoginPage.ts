 // LoginPage.ts

class LoginPage {
  submitButtonSelector = "#login";
  languageSelector = "#language-selector";
  sidebarSelector = "#sidebar";
  loginAsDisctrictAdmin(): void {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
  }

  loginAsDevDoctor(): void {
    cy.loginByApi("devdoctor", "Coronasafe@123");
  }

  loginAsStaff(): void {
    cy.loginByApi("staffdev", "Coronasafe@123");
  }

  loginManuallyAsDistrictAdmin(): void {
    cy.get("input[id='username']").type("devdistrictadmin");
    cy.get("input[id='password']").type("Coronasafe@123");
    cy.get("button").contains("Login").click();
  }

  loginManuallyAsNurse(): void {
    cy.get("input[id='username']").click().type("dummynurse1");
    cy.get("input[id='password']").click().type("Coronasafe@123");
    cy.get("button").contains("Login").click();
  }

  login(username: string, password: string): void {
    cy.loginByApi(username, password);
  }

  ensureLoggedIn(): void {
    cy.get("#user-profile-name").click();
    cy.get("#sign-out-button").scrollIntoView();
    cy.get("#sign-out-button").contains("Sign Out").should("exist");
  }
  
  ensurePageLoaded() {
+    cy.get(this.submitButtonSelector).should("be.visible");
+    cy.get(this.languageSelector).should("be.visible");
+    cy.get("input[id='username']").should("be.visible");
+    cy.get("input[id='password']").should("be.visible");
  }

  clickContributeOnGitHub() {
     cy.get('a[href="https://github.com/ohcnetwork"]').scrollIntoView().click();
  }

  clickThirdPartyLicense() {
     cy.get('a[href="/licenses"]').scrollIntoView().click();
  }

  selectLanguage(languageCode: string) {
    cy.get(this.languageSelector).select(languageCode);
  }

  verifySubmitButtonText(expectedText: string) {
    cy.get(this.submitButtonSelector).should("have.text", expectedText);
  }

  switchLanguageAndVerifyButtonText(languageMappings: {
    [key: string]: string;
  }) {
    Object.entries(languageMappings).forEach(([languageCode, expectedText]) => {
      this.selectLanguage(languageCode);
      +     cy.get(this.languageSelector)
+       .find(`option[value="${languageCode}"]`)
+       .should('exist')
+       .then(() => {
      +  cy.get(this.submitButtonSelector, { timeout: 10000 })
+    .should("be.visible")
+    .should("have.text", expectedText);
    });
  });
  }

  selectSidebarLanguage(languageCode: string) {
    cy.get(this.languageSelector).select(languageCode);
  }

  verifySidebarText(expectedText: string) {
+    cy.get(this.sidebarSelector).should("have.text", expectedText);
  }

  switchLanguageAndVerifySidebars(languageMappings: { [key: string]: string }) {
    Object.entries(languageMappings).forEach(([languageCode, expectedText]) => {
       this.selectLanguage(languageCode);
       cy.get(this.sidebarSelector, { timeout: 10000 })
+        .should("be.visible")
+        .and("have.text", expectedText);
    });
  }
}

export default LoginPage;
