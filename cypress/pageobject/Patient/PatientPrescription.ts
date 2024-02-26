export class PatientPrescription {
  clickAddPrescription() {
    cy.contains("button", "Add Prescription Medication")
      .should("be.visible")
      .click();
  }

  interceptMediaBase() {
    cy.intercept("GET", "**/api/v1/medibase/**").as("getMediaBase");
  }

  selectMedicine(medicine: string) {
    cy.searchAndSelectOption(
      "div#medicine_object input[placeholder='Select'][role='combobox']",
      medicine
    );
  }

  selectMedicinebox() {
    cy.get(
      "div#medicine_object input[placeholder='Select'][role='combobox']"
    ).click();
  }

  waitForMediabaseStatusCode() {
    cy.wait("@getMediaBase").its("response.statusCode").should("eq", 200);
  }

  enterDosage(doseAmount: string) {
    cy.get("#dosage").type(doseAmount, { force: true });
  }

  selectDosageFrequency(frequency: string) {
    cy.clickAndSelectOption("#frequency", frequency);
  }

  clickReturnToDashboard() {
    cy.verifyAndClickElement(
      "[data-testid='return-to-patient-dashboard']",
      "Return to Patient Dashboard"
    );
  }

  discontinuePreviousPrescription() {
    cy.intercept(
      "POST",
      "**/api/v1/consultation/*/prescriptions/*/discontinue/"
    ).as("deletePrescription");
    cy.get("button").contains("Discontinue").click();
    cy.get("#submit").contains("Discontinue").click();
    cy.wait("@deletePrescription").its("response.statusCode").should("eq", 200);
  }

  visitEditPrescriptionPage() {
    cy.get("#consultation_tab_nav").scrollIntoView();
    cy.get("#consultation_tab_nav").contains("Medicines").click();
    cy.get("a[href='prescriptions']").first().click();
  }
}
export default PatientPrescription;
