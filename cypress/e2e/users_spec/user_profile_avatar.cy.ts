import "cypress-file-upload";

describe(
  "User Profile Avatar Modification",
  {
    viewportHeight: 1000,
    viewportWidth: 400,
  },
  () => {
    beforeEach(() => {
      cy.loginByApi("devnurse");
      cy.visit("/");
      cy.intercept("GET", "/users/dev-nurse").as("getProfile");
      cy.visit("/users/dev-nurse");
      cy.wait("@getProfile").its("response.statusCode").should("eq", 200);
    });
    it("should upload an avatar", () => {
      cy.intercept("POST", "/api/v1/users/dev-nurse/profile_picture/").as(
        "uploadAvatar",
      );
      cy.get('button[id="change-avatar"]').should("be.visible").click();

      cy.get('input[title="changeFile"]').attachFile("avatar.jpg");
      cy.get('button[id="save-cover-image"]').should("be.visible").click();

      cy.wait("@uploadAvatar").its("response.statusCode").should("eq", 200);
    });

    it("should edit an avatar", () => {
      cy.intercept("POST", "/api/v1/users/dev-nurse/profile_picture/").as(
        "editAvatar",
      );
      cy.get('button[id="change-avatar"]').should("be.visible").click();

      cy.get('input[title="changeFile"]').attachFile("avatar.jpg");
      cy.get('button[id="save-cover-image"]').should("be.visible").click();

      cy.wait("@editAvatar").its("response.statusCode").should("eq", 200);
    });

    it("should delete an avatar", () => {
      cy.intercept("POST", "/api/v1/users/dev-nurse/profile_picture/").as(
        "uploadAvatar",
      );
      cy.get('button[id="change-avatar"]').should("be.visible").click();

      cy.get('input[title="changeFile"]').attachFile("avatar.jpg");
      cy.get('button[id="save-cover-image"]').should("be.visible").click();

      cy.wait("@uploadAvatar").its("response.statusCode").should("eq", 200);

      cy.intercept("DELETE", "/api/v1/users/dev-nurse/profile_picture/").as(
        "deleteAvatar",
      );

      cy.get('button[id="change-avatar"]').should("be.visible").click();
      cy.get('button[id="delete-button"]').should("be.visible").click();

      cy.wait("@deleteAvatar").its("response.statusCode").should("eq", 204);
    });
  },
);
