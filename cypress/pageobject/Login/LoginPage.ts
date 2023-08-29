// LoginPage.ts
class LoginPage {
  loginAsDisctrictAdmin(): void {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
  }

  login(username: string, password: string): void {
    cy.loginByApi(username, password);
  }
}

export default LoginPage;
