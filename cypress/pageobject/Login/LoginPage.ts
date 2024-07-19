// LoginPage.ts
import { cy } from "local-cypress";

class LoginPage {
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

  login(username: string, password: string): void {
    cy.loginByApi(username, password);
  }

  ensureLoggedIn(): void {
    cy.get("p").contains("Sign Out").should("exist");
  }
}

export default LoginPage;
