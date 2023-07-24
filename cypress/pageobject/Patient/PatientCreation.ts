// PatientPage.ts

let patient_url = "";

export class PatientPage {
  createPatient() {
    cy.get("button").should("contain", "Add Patient Details");
    cy.get("#add-patient-div").click();
  }

  selectFacility(facilityName: string) {
    cy.get("input[name='facilities']")
      .type(facilityName)
      .then(() => {
        cy.get("[role='option']").first().click();
      });
    cy.get("button").should("contain", "Select");
    cy.get("button").get("#submit").click();
  }

  enterPatientDetails(
    phoneNumber: string,
    emergencyPhoneNumber: string,
    patientName: string,
    gender: string,
    address: string,
    pincode: string,
    wardName: string,
    bloodGroup: string
  ) {
    cy.get("#phone_number-div").type(phoneNumber);
    cy.get("#emergency_phone_number-div").type(emergencyPhoneNumber);
    cy.get("[data-testid=date-of-birth] button").click();
    cy.get("#date-1").click();
    cy.get("[data-testid=name] input").type(patientName);
    cy.get("[data-testid=Gender] button")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(gender).click();
      });
    cy.get("[data-testid=current-address] textarea").type(address);
    cy.get("[data-testid=permanent-address] input").check();
    cy.get("#pincode").type(pincode);
    cy.get("[data-testid=localbody] button")
      .click()
      .then(() => {
        cy.get("[role='option']").first().click();
      });
    cy.get("[data-testid=ward-respective-lsgi] button")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(wardName).click();
      });
    cy.get("[name=medical_history_check_1]").check();
    cy.get("[data-testid=blood-group] button")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(bloodGroup).click();
      });
  }

  clickCreatePatient() {
    cy.get("button[data-testid='submit-button']").click();
  }

  verifyPatientIsCreated() {
    cy.get("h2").should("contain", "Create Consultation");
    cy.url().should("include", "/patient");
  }

  saveCreatedPatientUrl() {
    cy.url().then((url) => {
      cy.log(url);
      patient_url = url.split("/").slice(0, -1).join("/");
      cy.log(patient_url);
    });
  }

  visitCreatedPatient() {
    cy.awaitUrl(patient_url);
  }

  verifyPatientDetails(
    age: string,
    patientName: string,
    phone_number: string,
    emergency_phone_number: string,
    yearOfBirth: string,
    bloodGroup: string
  ) {
    cy.url().should("include", "/facility/");
    cy.get("[data-testid=patient-dashboard]").should("contain", age);
    cy.get("[data-testid=patient-dashboard]").should("contain", patientName);
    cy.get("[data-testid=patient-dashboard]").should("contain", phone_number);
    cy.get("[data-testid=patient-dashboard]").should(
      "contain",
      emergency_phone_number
    );
    cy.get("[data-testid=patient-dashboard]").should("contain", yearOfBirth);
    cy.get("[data-testid=patient-dashboard]").should("contain", bloodGroup);
  }

  visitUpdatePatientUrl() {
    cy.awaitUrl(patient_url + "/update");
  }
}
