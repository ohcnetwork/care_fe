export class PatientPrescription {
  clickAddPrescription() {
    cy.contains("button", "Add Prescription Medication")
      .should("be.visible")
      .click();
  }

  interceptMediaBase() {
    cy.intercept("GET", "**/api/v1/medibase/**").as("getMediaBase");
  }

  prescribefirstMedicine() {
    cy.get("div#medicine_object input[placeholder='Select'][role='combobox']")
      .click()
      .type("dolo")
      .type("{downarrow}{enter}");
  }

  prescribesecondMedicine() {
    cy.get("div#medicine_object input[placeholder='Select'][role='combobox']")
      .click()
      .type("dolo")
      .type("{downarrow}{downarrow}{enter}");
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
    cy.get("#frequency")
      .click()
      .then(() => {
        cy.get("div#frequency [role='option']").contains(frequency).click();
      });
  }

  submitPrescriptionAndReturn() {
    cy.intercept("POST", "**/api/v1/consultation/*/prescriptions/").as(
      "submitPrescription"
    );
    cy.get("button#submit").should("be.visible").click();
    cy.get("[data-testid='return-to-patient-dashboard']").click();
    cy.wait("@submitPrescription").its("response.statusCode").should("eq", 201);
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

  submitPrescription() {
    cy.intercept("POST", "**/api/v1/consultation/*/prescriptions/").as(
      "submitPrescription"
    );
    cy.get("#submit").contains("Submit").click();
    cy.wait("@submitPrescription").its("response.statusCode").should("eq", 201);
  }
}
export default PatientPrescription;
