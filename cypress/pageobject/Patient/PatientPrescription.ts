export class PatientPrescription {
  clickAddPrescription() {
    cy.contains("button", "Add Prescription Medication")
      .should("be.visible")
      .click();
  }

  interceptMedibase() {
    cy.intercept("GET", "**/api/v1/medibase/**").as("getMedibase");
  }

  selectMedicine(medicine: string) {
    cy.searchAndSelectOption(
      "div#medicine_object input[placeholder='Select'][role='combobox']",
      medicine,
    );
  }

  clickTitratedDosage() {
    cy.get("#titrated-dosage").click();
  }

  clickAdministerButton() {
    cy.get("#administer-medicine").should("be.visible");
    cy.verifyAndClickElement("#administer-medicine", "Administer");
  }

  selectMedicinebox() {
    cy.get(
      "div#medicine_object input[placeholder='Select'][role='combobox']",
    ).click();
  }

  waitForMedibaseStatusCode() {
    cy.wait("@getMedibase").its("response.statusCode").should("eq", 200);
  }

  enterDosage(doseAmount: string) {
    cy.get("#base_dosage").type(doseAmount, { force: true });
  }

  enterAdministerDosage(dosage: string) {
    cy.get("#dosage").type(dosage);
  }

  enterAdministerNotes(notes: string) {
    cy.get("#administration_notes").type(notes);
  }

  enterTargetDosage(targetDosage: string) {
    cy.get("#target_dosage").type(targetDosage);
  }

  selectDosageFrequency(frequency: string) {
    cy.clickAndSelectOption("#frequency", frequency);
  }

  clickReturnToDashboard() {
    cy.verifyAndClickElement(
      "[data-testid='return-to-patient-dashboard']",
      "Return to Patient Dashboard",
    );
  }

  discontinuePreviousPrescription() {
    cy.intercept(
      "POST",
      "**/api/v1/consultation/*/prescriptions/*/discontinue/",
    ).as("deletePrescription");
    cy.get("button").contains("Discontinue").click();
    cy.get("#submit").contains("Discontinue").click();
    cy.wait("@deletePrescription").its("response.statusCode").should("eq", 200);
  }

  visitMedicineTab() {
    cy.get("#consultation_tab_nav").scrollIntoView();
    cy.get("#consultation_tab_nav").contains("Medicines").click();
    cy.get("a[href='prescriptions']").first().click();
  }
}
export default PatientPrescription;
