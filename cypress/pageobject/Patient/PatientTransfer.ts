class PatientTransfer {
  clickAdmitPatientRecordButton() {
    cy.get("#transfer").click();
  }

  clickTransferPopupContinueButton() {
    cy.get("#submit-continue-button").click();
  }

  clickTransferPatientNameList(facilityName: string) {
    cy.get("#patient").click();
    cy.get("li[role=option]").contains(facilityName).click();
  }

  clickTransferPatientYOB(yearOfBirth: string) {
    cy.get("#year_of_birth").scrollIntoView();
    cy.get("#year_of_birth").should("be.visible").click().type(yearOfBirth);
  }

  clickTransferSubmitButton() {
    cy.get("#submit-transferpatient").click();
    cy.wait(2000);
  }

  clickConsultationCancelButton() {
    cy.get("#cancel").scrollIntoView();
    cy.get("#cancel").click();
    cy.wait(2000);
  }

  clickAllowPatientTransferButton() {
    cy.get("#patient-allow-transfer").click();
  }
}

export default PatientTransfer;
