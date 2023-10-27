// PatientPage.ts

let patient_url = "";

export class PatientPage {
  createPatient() {
    cy.intercept("GET", "**/api/v1/facility/**").as("getFacilities");
    cy.get("#add-patient-details").should("be.visible");
    cy.get("#add-patient-details").click();
    cy.wait("@getFacilities").its("response.statusCode").should("eq", 200);
  }

  visitPatient() {
    cy.intercept("GET", "**/api/v1/consultation/**").as("getPatient");
    cy.get("[data-cy='patient']").first().click();
    cy.wait("@getPatient").its("response.statusCode").should("eq", 200);
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

  interceptCreatePatientAPI() {
    cy.intercept("GET", "**/facility/*/patient/**").as("createPatient");
  }

  verifyCreatedPatientResponse() {
    cy.wait("@createPatient").its("response.statusCode").should("eq", 200);
  }

  enterPatientDetails(
    phoneNumber: string,
    emergencyPhoneNumber: string,
    patientName: string,
    gender: string,
    address: string,
    pincode: string,
    wardName: string,
    bloodGroup: string,
    dateOfBirth: string
  ) {
    cy.get("#phone_number-div").type(phoneNumber);
    cy.get("#emergency_phone_number-div").type(emergencyPhoneNumber);
    cy.get("#date_of_birth").should("be.visible").click();
    cy.get("#date-input").click().type(dateOfBirth);
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
    cy.intercept("POST", "**/api/v1/patient/").as("createPatient");
    cy.get("button[data-testid='submit-button']").click();
    cy.wait("@createPatient").its("response.statusCode").should("eq", 201);
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
    age: number,
    patientName: string,
    phoneNumber: string,
    emergencyPhoneNumber: string,
    yearOfBirth: string,
    bloodGroup: string
  ) {
    cy.url().should("include", "/facility/");
    cy.get("[data-testid=patient-dashboard]").should("contain", age);
    cy.get("[data-testid=patient-dashboard]").should("contain", patientName);
    cy.get("[data-testid=patient-dashboard]").should("contain", phoneNumber);
    cy.get("[data-testid=patient-dashboard]").should(
      "contain",
      emergencyPhoneNumber
    );
    cy.get("[data-testid=patient-dashboard]").should("contain", yearOfBirth);
    cy.get("[data-testid=patient-dashboard]").should("contain", bloodGroup);
  }

  visitUpdatePatientUrl() {
    cy.awaitUrl(patient_url + "/update");
  }

  interceptFacilities() {
    cy.intercept("GET", "**/facility/*/patient/**").as("getFacilities");
  }

  verifyStatusCode() {
    cy.wait("@getFacilities").its("response.statusCode").should("eq", 200);
  }

  patientformvisibility() {
    cy.get("[data-testid='current-address']").scrollIntoView();
  }
}
