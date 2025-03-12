import { UserAvatar } from "@/pageObject/Users/UserAvatar";

describe("User Profile Avatar Modification", () => {
  const userAvatar = new UserAvatar("staff-1");
  beforeEach(() => {
    cy.loginByApi("staff-1");
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
