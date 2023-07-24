let patient_url = "";

export class UpdatePatientPage {
  enterPatientDetails() {
    cy.get("[data-testid=name] input").clear();
    cy.get("[data-testid=name] input").type("Test E2E User Edited");
    cy.get("#emergency_phone_number-div")
      .clear()
      .then(() => {
        cy.get("#emergency_phone_number__country").select("IN");
      });
    cy.get("#emergency_phone_number-div").type("9120330220");
    cy.get("#address").clear().type("Test Patient Address Edited");
    cy.get("#present_health").type("Severe Cough");
    cy.get("#ongoing_medication").type("Paracetamol");
    cy.get("#allergies").type("Dust");
    cy.get("[name=medical_history_check_1]").uncheck();
    cy.get("[name=medical_history_check_2]").check();
    cy.get("#medical_history_2").type("2 months ago");
    cy.get("[name=medical_history_check_3]").check();
    cy.get("#medical_history_3").type("1 month ago");
    cy.get("button").get("[data-testid=add-insurance-button]").click();
    cy.get("#subscriber_id").type("SUB123");
    cy.get("#policy_id").type("P123");
    cy.get("#insurer_id").type("GICOFINDIA");
    cy.get("#insurer_name").type("GICOFINDIA");
  }

  clickUpdatePatient() {
    cy.get("button").get("[data-testid=submit-button]").click();
  }

  verifyPatientUpdated() {
    cy.url().should("include", "/patient");
  }

  saveUpdatedPatientUrl() {
    cy.url().then((url) => {
      cy.log(url);
      patient_url = url.split("/").slice(0, -1).join("/");
      cy.log(patient_url);
    });
  }
}
