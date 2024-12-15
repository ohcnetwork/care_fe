// ResoucrePage.ts
class ResourcePage {
  verifyDownloadButtonWorks() {
    cy.get("svg.care-svg-icon__baseline.care-l-export").each(($button) => {
      cy.intercept(/\/api\/v1\/resource/).as("resource_download");
      cy.wrap($button).click({ force: true });
      cy.wait("@resource_download")
        .its("response.statusCode")
        .should("eq", 200);
    });
  }

  spyResourceApi() {
    cy.intercept(/\/api\/v1\/resource/).as("resource");
  }

  clickCompletedResources() {
    cy.contains("button", "Completed").click();
  }

  verifyCompletedResources() {
    cy.wait("@resource").its("response.statusCode").should("eq", 200);
    cy.contains("button", "Active").should("have.class", "text-primary-500");
    cy.contains("button", "Completed").should("have.class", "text-white");
  }

  clickActiveResources() {
    cy.contains("button", "Active").click();
  }

  navigationToResourcePage() {
    cy.awaitUrl("/resource");
  }

  verifyActiveResources() {
    cy.wait("@resource").its("response.statusCode").should("eq", 200);
    cy.contains("button", "Active").should("have.class", "text-white");
    cy.contains("button", "Completed").should("have.class", "text-primary-500");
  }

  clickListViewButton() {
    cy.contains("List View").click();
  }

  clickBoardViewButton() {
    cy.contains("Board View").click();
  }

  clickUpdateStatus() {
    cy.get("[data-testid='update-status']").click();
  }

  updateStatus(status: string) {
    cy.get("#status").click();
    cy.get("[role='option']").contains(status).click();
  }

  clickSubmitButton() {
    cy.intercept("PUT", "**/api/v1/resource/**/").as("updateResource");
    cy.get("#submit").contains("Submit").click();
    cy.wait("@updateResource").its("response.statusCode").should("eq", 200);
  }

  verifySuccessNotification(message: string) {
    cy.verifyNotification(message);
  }

  addCommentForResource(comment: string) {
    cy.get("#comment").type(comment);
  }

  clickPostCommentButton() {
    cy.intercept("POST", "**/api/v1/resource/*/comment/").as("postComment");
    cy.contains("Post Your Comment").click();
    cy.wait("@postComment").its("response.statusCode").should("eq", 201);
  }
}

export default ResourcePage;
