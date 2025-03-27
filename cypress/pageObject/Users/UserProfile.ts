export class UserProfile {
  openUserMenu() {
    cy.get('[data-cy="user-menu-dropdown"]').click();
    return this;
  }

  clickUserProfile() {
    cy.get('[data-cy="user-menu-profile"]').click();
    return this;
  }

  clickUserLogout() {
    cy.verifyAndClickElement('[data-cy="user-menu-logout"]', "Log Out");
    return this;
  }
}
