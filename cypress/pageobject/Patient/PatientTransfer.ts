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
  }

  clickConsultationCancelButton() {
    cy.get("#cancel").scrollIntoView();
    cy.get("#cancel").click();
  }

  clickAllowPatientTransferButton() {
    cy.get("#patient-allow-transfer").click();
  }

  verifyFacilitySuccessfullMessage() {
    cy.get(".pnotify")
      .should("exist")
      .within(() => {
        cy.get(".pnotify-text")
          .invoke("text")
          .then((text) => {
            expect(text.trim()).to.match(
              /^Patient Dummy Patient 10 \(Male\) transferred successfully$/i
            );
          });
      });
  }

  verifyFacilityErrorMessage() {
    cy.get(".pnotify")
      .should("exist")
      .within(() => {
        cy.get(".pnotify-text")
          .invoke("text")
          .then((text) => {
            expect(text).to.match(
              /Patient - Patient transfer cannot be completed because the patient has an active consultation in the same facility/
            );
          });
      });
  }
}

export default PatientTransfer;
