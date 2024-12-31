export class PatientPrescription {
  clickAddPrescription() {
    cy.get("#add-prescription").scrollIntoView();
    cy.verifyAndClickElement(
      "#add-prescription",
      "Add Prescription Medication",
    );
  }

  clickAddPrnPrescriptionButton() {
    cy.contains("button", "Add PRN Prescription").click();
  }

  interceptMedibase() {
    cy.intercept("GET", "**/api/v1/medibase/**").as("getMedibase");
  }

  selectMedicine(medicine: string) {
    cy.typeAndSelectOption(
      "div#medicine_object input[placeholder='Select'][role='combobox']",
      medicine,
    );
  }

  clickTitratedDosage() {
    cy.get("#titrated-dosage").click();
  }

  clickAdministerButton() {
    cy.get("#administer-medicine").scrollIntoView().should("be.visible");
    cy.verifyAndClickElement("#administer-medicine", "Administer");
  }

  clickAdministerBulkMedicine() {
    cy.get("#bulk-administer").should("be.visible");
    cy.get("#bulk-administer").click();
  }

  clickAllVisibleAdministration() {
    cy.get("#should_administer").should("be.visible").click();
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
    cy.get("#base_dosage").clear({ force: true });
    cy.get("#base_dosage").click({ force: true });
    cy.get("#base_dosage").type(doseAmount, { force: true });
  }

  enterIndicator(indicator: string) {
    cy.get("#indicator").type(indicator);
  }

  enterDiscontinueReason(reason: string) {
    cy.get("#discontinuedReason").should("be.visible").type(reason);
  }

  enterAdministerDosage(dosage: string) {
    cy.get("#dosage").type(dosage);
  }

  enterAdministerNotes(notes: string) {
    cy.get("#administration_notes").type(notes);
  }

  enterTargetDosage(targetDosage: string) {
    cy.get("#target_dosage").type(targetDosage, { force: true });
  }

  selectDosageFrequency(frequency: string) {
    cy.clickAndSelectOption("#frequency", frequency);
  }

  interceptPrescriptions() {
    cy.intercept("GET", "**/api/v1/consultation/*/prescriptions/*").as(
      "getPrescriptions",
    );
  }

  verifyPrescription() {
    cy.wait("@getPrescriptions").its("response.statusCode").should("eq", 200);
  }

  clickReturnToDashboard() {
    cy.verifyAndClickElement(
      "[data-testid='return-to-patient-dashboard']",
      "Return to Patient Dashboard",
    );
  }

  clickAdministerSelectedMedicine() {
    cy.get("#administer-selected-medicine").should("be.visible");
    cy.get("#administer-selected-medicine").click();
  }

  visitMedicineTab() {
    cy.get("#consultation_tab_nav").scrollIntoView();
    cy.get("#consultation_tab_nav").contains("Medicines").click();
  }

  visitEditPrescription() {
    cy.get("#edit-prescription").click();
  }
}
export default PatientPrescription;
