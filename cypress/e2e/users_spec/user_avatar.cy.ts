import { UserAvatar } from "@/pageObject/Users/UserAvatar";

describe("User Profile Avatar Modification", () => {
  const userAvatar = new UserAvatar("teststaff4");
  beforeEach(() => {
    cy.loginByApi("teststaff4");
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
