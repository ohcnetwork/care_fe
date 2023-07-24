export class PatientConsultationPage {
  selectConsultationStatus(status: string) {
    cy.get("#consultation_status")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(status).click();
      });
  }

  selectSymptoms(symptoms: string) {
    cy.get("#symptoms")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(symptoms).click();
      });
  }

  enterConsultationDetails(
    illnessHistory: string,
    examinationDetails: string,
    weight: string,
    height: string,
    ipNumber: string,
    consulationNotes: string,
    verificationBy: string
  ) {
    cy.get("#symptoms").click();
    cy.get("#history_of_present_illness").click().type(illnessHistory);
    cy.get("#examination_details").click().type(examinationDetails);
    cy.get("#weight").click().type(height);
    cy.get("#height").click().type(weight);
    cy.get("#ip_no").type(ipNumber);
    cy.get(
      "#icd11_diagnoses_object input[placeholder='Select'][role='combobox']"
    )
      .click()
      .type("1A");
    cy.wait(1000);
    cy.get("#icd11_diagnoses_object [role='option']")
      .contains("1A03 Intestinal infections due to Escherichia coli")
      .click();
    cy.get("#consultation_notes").click().type(consulationNotes);
    cy.get("#verified_by").click().type(verificationBy);
  }

  submitConsultation() {
    cy.get("#submit").click();
  }

  clickAddPrescription() {
    cy.contains("button", "Add Prescription Medication")
      .should("be.visible")
      .click();
  }

  prescribeMedicine() {
    cy.get("div#medicine_object input[placeholder='Select'][role='combobox']")
      .click()
      .type("dolo");
    cy.get("div#medicine_object [role='option']")
      .contains("DOLO")
      .should("be.visible")
      .click();
  }

  enterDosage(doseAmount: string) {
    cy.get("#dosage").click().type(doseAmount);
  }

  selectDosageFrequency(frequency: string) {
    cy.get("#frequency")
      .click()
      .then(() => {
        cy.get("div#frequency [role='option']").contains(frequency).click();
      });
  }

  submitPrescriptionAndReturn() {
    cy.get("button#submit").should("be.visible").click();
    cy.get("[data-testid='return-to-patient-dashboard']").click();
  }
}
