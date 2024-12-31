class LoginPage {
  loginByRole(role: string) {
    // Implementation of login logic
    cy.visit("/login");
    cy.fixture("users").then((users) => {
      const user = users[role];
      cy.get("[data-cy=username]").type(user.username);
      cy.get("[data-cy=password]").type(user.password);
      cy.get("[data-cy=submit]").click();
    });
  }
}

export default LoginPage;
