import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import ResourcePage from "../../pageobject/Resource/ResourcePage";

describe("Resource Page", () => {
  const loginPage = new LoginPage();
  const resourcePage = new ResourcePage();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/resource");
  });

  it("Checks if all download button works", () => {
    resourcePage.verifyDownloadButtonWorks();
  });

  it("Switch between active/completed", () => {
    resourcePage.spyResourceApi();
    resourcePage.clickCompletedResources();
    resourcePage.verifyCompletedResources();
    resourcePage.spyResourceApi();
    resourcePage.clickActiveResources();
    resourcePage.verifyActiveResources();
  });

  it("Switch between list view and board view", () => {
    resourcePage.clickListViewButton();
    resourcePage.clickBoardViewButton();
  });

  it("Update the status of resource", () => {
    resourcePage.openAlreadyCreatedResource();
    resourcePage.clickUpdateStatus();
    resourcePage.updateStatus("APPROVED");
    resourcePage.clickSubmitButton();
    resourcePage.verifySuccessNotification(
      "Resource request updated successfully"
    );
  });

  it("Post comment for a resource", () => {
    resourcePage.openAlreadyCreatedResource();
    resourcePage.addCommentForResource("Test comment");
    resourcePage.clickPostCommentButton();
    resourcePage.verifySuccessNotification("Comment added successfully");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
