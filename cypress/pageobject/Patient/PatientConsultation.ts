export class PatientConsultationPage {
  selectConsultationStatus(status: string) {
    cy.get("#route_to_facility")
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

  fillIllnessHistory(history: string) {
    cy.wait(5000);
    cy.get("#history_of_present_illness").scrollIntoView();
    cy.get("#history_of_present_illness").should("be.visible");
    cy.get("#history_of_present_illness").click().type(history);
  }

  enterConsultationDetails(
    category: string,
    examinationDetails: string,
    weight: string,
    height: string,
    ipNumber: string,
    consulationNotes: string,
    verificationBy: string
  ) {
    cy.get("#symptoms").click();
    cy.get("#category")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(category).click();
      });
    cy.get("#examination_details").click().type(examinationDetails);
    cy.get("#weight").click().type(height);
    cy.get("#height").click().type(weight);
    cy.get("#patient_no").type(ipNumber);
    cy.intercept("GET", "**/icd/**").as("getIcdResults");
    cy.get(
      "#icd11_diagnoses_object input[placeholder='Select'][role='combobox']"
    )
      .scrollIntoView()
      .click()
      .type("1A");
    cy.get("#icd11_diagnoses_object [role='option']")
      .contains("1A00 Cholera")
      .scrollIntoView()
      .click();
    cy.get("label[for='icd11_diagnoses_object']").click();
    cy.wait("@getIcdResults").its("response.statusCode").should("eq", 200);

    cy.get("#icd11_principal_diagnosis [role='combobox']").click().type("1A");
    cy.get("#icd11_principal_diagnosis [role='option']")
      .contains("1A00 Cholera")
      .click();

    cy.get("#consultation_notes").click().type(consulationNotes);
    cy.get("#treating_physician")
      .click()
      .type(verificationBy)
      .then(() => {
        cy.get("[role='option']").contains("Dev Doctor").click();
      });
  }

  submitConsultation() {
    cy.get("#submit").click();
  }

  clickAddPrescription() {
    cy.contains("button", "Add Prescription Medication")
      .should("be.visible")
      .click();
  }

  interceptMediaBase() {
    cy.intercept("GET", "**/api/v1/medibase/**").as("getMediaBase");
  }

  prescribeMedicine() {
    cy.get("div#medicine_object input[placeholder='Select'][role='combobox']")
      .click()
      .type("dolo{enter}");
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
}
