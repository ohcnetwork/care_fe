// LoginPage.ts
import { cy } from "local-cypress";

class LoginPage {
  loginAsDisctrictAdmin(): void {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
  }

  loginAsDevDoctor(): void {
    cy.loginByApi("devdoctor", "Coronasafe@123");
  }

  login(username: string, password: string): void {
    cy.loginByApi(username, password);
  }
}

export default LoginPage;
