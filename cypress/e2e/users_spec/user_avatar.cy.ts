import { UserAvatar } from "@/pageObject/Users/UserAvatar";

describe("User Profile Avatar Modification", () => {
  const userAvatar = new UserAvatar("doctor_2_0");
  beforeEach(() => {
    cy.loginByApi("doctor");
    cy.visit("/");
  });
  it("should modify an avatar", () => {
    userAvatar
      .navigateToProfile()
      .interceptUploadAvatarRequest()
      .clickChangeAvatarButton()
      .uploadAvatar()
      .clickCropAvatar()
      .clickSaveAvatarButton()
      .verifyUploadAvatarApiCall()
      .interceptDeleteAvatarRequest()
      .clickChangeAvatarButton()
      .clickDeleteAvatarButton()
      .verifyDeleteAvatarApiCall();
  });
});
