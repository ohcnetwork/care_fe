export class UserAvatar {
  username: string;
  constructor(username: string) {
    this.username = username;
  }

  navigateToProfile() {
    cy.visit(`/users/${this.username}`);
    return this;
  }

  interceptUploadAvatarRequest() {
    cy.intercept("POST", `/api/v1/users/${this.username}/profile_picture/`).as(
      "uploadAvatar",
    );
    return this;
  }

  clickChangeAvatarButton() {
    cy.verifyAndClickElement('[data-cy="change-avatar"]', "Change Avatar");
    return this;
  }

  uploadAvatar() {
    cy.get('input[title="changeFile"]').selectFile(
      "cypress/fixtures/avatar.jpg",
      { force: true },
    );
    return this;
  }

  clickSaveAvatarButton() {
    cy.get("button").contains("Upload").click();
    return this;
  }

  clickCropAvatar() {
    cy.get("button").contains("Crop").click();
    return this;
  }

  verifyUploadAvatarApiCall() {
    cy.wait("@uploadAvatar").its("response.statusCode").should("eq", 200);
    return this;
  }

  interceptDeleteAvatarRequest() {
    cy.intercept(
      "DELETE",
      `/api/v1/users/${this.username}/profile_picture/`,
    ).as("deleteAvatar");
    return this;
  }

  clickDeleteAvatarButton() {
    cy.get('[role="dialog"], .modal')
      .should("exist")
      .within(() => {
        cy.contains("button", "Delete").should("be.visible").click();
      });

    return this;
  }

  verifyDeleteAvatarApiCall() {
    cy.wait("@deleteAvatar").its("response.statusCode").should("eq", 204);
    return this;
  }
}
