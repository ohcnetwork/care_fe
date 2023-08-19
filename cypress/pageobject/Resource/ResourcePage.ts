// ResoucrePage.ts
class ResourcePage {
  verifyDownloadButtonWorks() {
    cy.get("svg.care-svg-icon__baseline.care-l-export").each(($button) => {
      cy.intercept(/\/api\/v1\/resource/).as("resource_download");
      cy.wrap($button).click({ force: true });
      cy.wait("@resource_download").then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
      });
    });
  }

  spyResourceApi() {
    cy.intercept(/\/api\/v1\/resource/).as("resource");
  }

  clickCompletedResources() {
    cy.contains("Completed").click();
  }

  verifyCompletedResources() {
    cy.wait("@resource").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });
    cy.contains("Active").should("have.class", "text-primary-500");
    cy.contains("Completed").should("have.class", "text-white");
  }

  clickActiveResources() {
    cy.contains("Active").click();
  }

  verifyActiveResources() {
    cy.wait("@resource").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });
    cy.contains("Active").should("have.class", "text-white");
    cy.contains("Completed").should("have.class", "text-primary-500");
  }

  clickListViewButton() {
    cy.contains("List View").click();
  }

  clickBoardViewButton() {
    cy.contains("Board View").click();
  }

  openAlreadyCreatedResource() {
    cy.get("[data-testid='resource-details']").first().click();
  }

  clickUpdateStatus() {
    cy.get("[data-testid='update-status']").click();
  }

  updateStatus(status: string) {
    cy.get("#status").click();
    cy.get("[role='option']").contains(status).click();
  }

  clickSubmitButton() {
    cy.get("#submit").contains("Submit").click();
  }

  verifySuccessNotification(message: string) {
    cy.verifyNotification(message);
  }

  addCommentForResource(comment: string) {
    cy.get("#comment").type(comment);
  }

  clickPostCommentButton() {
    cy.contains("Post Your Comment").click();
  }
}

export default ResourcePage;
