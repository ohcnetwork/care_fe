export class SampleTestPage {
  sampleTestReportHistory = 0;
  patientName = ""; // to search patient in sample page

  visitPatientDashboardPage() {
    cy.wait(1000);
    cy.get(".patient-stable-ring").should("be.visible");
    cy.get(".patient-stable-ring").first().click();
    cy.get("#patient-name")
      .invoke("text")
      .then((patientName) => {
        // Trim any excess whitespace
        this.patientName = patientName.trim();
      });
    cy.get("#patient-details").should("be.visible");
    cy.get("#patient-details").click();
  }

  visitSampleRequestPage() {
    cy.get("body").then(($body) => {
      if ($body.find("#sample-test-history").length > 0) {
        cy.get("#sample-test-history")
          .its("length")
          .then((count) => {
            this.sampleTestReportHistory = count;
          });
      } else {
        // Element does not exist, set to 0
        this.sampleTestReportHistory = 0;
      }
    });

    cy.get("#sample-request-btn").should("be.visible");
    cy.get("#sample-request-btn").click();
  }

  selectSampleType(option: string) {
    cy.get("#sample-type").should("be.visible");
    cy.get("#sample-type").click();
    cy.get("[role='option']").contains(option).click();
  }

  selectIcmrCategory(option: string) {
    cy.get("#icmr-category").should("be.visible");
    cy.get("#icmr-category").click();
    cy.get("[role='option']").contains(option).click();
  }

  typeIcmrLabel(label: string) {
    cy.get("#icmr-label").should("be.visible");
    cy.get("#icmr-label").type(label);
  }

  submitForm() {
    cy.get("#sample-test-submit-btn").should("be.visible");
    cy.get("#sample-test-submit-btn").click();
  }

  clickOnNotification() {
    cy.get(".pnotify-container").should("be.visible");
    cy.get(".pnotify-container").click();
  }

  checkRequestHistory() {
    cy.get("#sample-test-history").should(
      "have.length",
      this.sampleTestReportHistory + 1,
    );
  }
}
