import { UserAvatar } from "@/pageObject/Users/UserAvatar";

describe("User Profile Avatar Modification", () => {
  const userAvatar = new UserAvatar("dev-nurse");
  beforeEach(() => {
    cy.loginByApi("devnurse");
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
