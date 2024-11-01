export class SampleTestPage {
  sampleTestReportHistory = 0;
  patientName = ""; // to search for patient in sample page

  visitPatientPage() {
    cy.awaitUrl("/patients");
  }

  visitPatientDashboardPage() {
    cy.get(".patient-stable-ring").first().scrollIntoView();
    cy.get(".patient-stable-ring").should("be.visible").first().click();
    cy.get("#patient-name")
      .invoke("text")
      .then((patientName) => {
        this.patientName = patientName.trim();
      });
    cy.get("#patient-details").should("be.visible").click();
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
        // Set to 0 if the element does not exist
        this.sampleTestReportHistory = 0;
      }
    });
    cy.get("#sample-request-btn").scrollIntoView();
    cy.get("#sample-request-btn").should("be.visible").click();
  }

  selectSampleType(option: string) {
    cy.get("#sample-type").should("be.visible").click();
    cy.get("[role='option']").contains(option).click();
  }

  selectIcmrCategory(option: string) {
    cy.get("#icmr-category").should("be.visible").click();
    cy.get("[role='option']").contains(option).click();
  }

  typeIcmrLabel(label: string) {
    cy.get("#icmr-label").should("be.visible").type(label);
  }

  submitForm() {
    cy.get("#sample-test-submit-btn").scrollIntoView();
    cy.get("#sample-test-submit-btn").should("be.visible").click();
  }

  clickOnNotification() {
    cy.get(".pnotify-container").should("be.visible").click();
  }

  checkRequestHistory() {
    cy.get("#sample-test-history").scrollIntoView();
    cy.get("#sample-test-history").should(
      "have.length",
      this.sampleTestReportHistory + 1,
    );
  }

  visitSamplePage() {
    cy.awaitUrl("/sample");
  }

  searchPatientSample() {
    cy.get("#search_patient_name").should("be.visible").type(this.patientName);
  }

  patientSampleMustExist() {
    cy.get("#sample-card").should("be.visible");
  }
}
