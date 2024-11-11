// LoginPage.ts

class LoginPage {
  loginAsDistrictAdmin(): void {
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

  clickSignOutBtn(): void {
    cy.verifyAndClickElement("#sign-out-button", "Sign Out");
  }
}

export default LoginPage;
