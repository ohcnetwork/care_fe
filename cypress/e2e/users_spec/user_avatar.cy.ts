import { UserAvatar } from "@/pageObject/Users/UserAvatar";

describe("User Profile Avatar Modification", () => {
  const userAvatar = new UserAvatar("development-adm");
  beforeEach(() => {
    cy.loginByApi("devadmin");
    cy.visit("/");
  });
  it("should modify an avatar", () => {
    userAvatar
      .navigateToProfile()
      .interceptUploadAvatarRequest()
      .clickChangeAvatarButton()
      .uploadAvatar()
      .clickSaveAvatarButton()
      .verifyUploadAvatarApiCall()
      .interceptDeleteAvatarRequest()
      .clickChangeAvatarButton()
      .clickDeleteAvatarButton()
      .verifyDeleteAvatarApiCall();
  });
});
