// PatientPage.ts

let patient_url = "";

export class PatientPage {
  createPatient() {
    cy.intercept("GET", "**/api/v1/facility/**").as("getFacilities");
    cy.get("#add-patient-details").should("be.visible");
    cy.get("#add-patient-details").click();
    cy.wait("@getFacilities").its("response.statusCode").should("eq", 200);
  }

  visitPatient(patientName) {
    cy.get("#name").click().type(patientName);
    cy.intercept("GET", "**/api/v1/consultation/**").as("getPatient");
    cy.get("#patient-name-list").contains(patientName).click();
    cy.wait("@getPatient").its("response.statusCode").should("eq", 200);
    cy.get("#patient-name-consultation")
      .should("be.visible")
      .contains(patientName);
  }

  selectFacility(facilityName: string) {
    cy.get("input[name='facilities']")
      .type(facilityName)
      .then(() => {
        cy.get("[role='option']").contains(facilityName).click();
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

  verifyPatientNameList(patientName: string) {
    cy.get("#patient-name-list").contains(patientName);
  }

  typePatientPhoneNumber(phoneNumber: string) {
    cy.get("#phone_number-div").click().type(phoneNumber);
  }

  typePatientEmergencyNumber(phoneNumber: string) {
    cy.get("#emergency_phone_number-div").click().type(phoneNumber);
  }

  typePatientDateOfBirth(dateOfBirth: string) {
    cy.get("#date_of_birth").scrollIntoView();
    cy.get("#date_of_birth").should("be.visible").click();
    cy.get("#date-input").click().type(dateOfBirth);
  }

  typePatientName(patientName: string) {
    cy.get("[data-testid=name] input")
      .click()
      .clear()
      .click()
      .type(patientName);
  }

  typePatientNameList(patientName: string) {
    cy.get("#name").click().type(patientName);
  }

  typePatientAddress(address: string) {
    cy.get("[data-testid=current-address] textarea")
      .click()
      .clear()
      .click()
      .type(address);
  }

  typePatientPresentHealth(presentHealth: string) {
    cy.get("#present_health").click().type(presentHealth);
  }

  typePatientOngoingMedication(ongoingMedication: string) {
    cy.get("#ongoing_medication").click().type(ongoingMedication);
  }

  typePatientAllergies(allergies: string) {
    cy.get("#allergies").click().type(allergies);
  }

  clickPermanentAddress() {
    cy.get("[data-testid=permanent-address] input").check();
  }

  clickPatientAntenatalStatusYes() {
    cy.get("#is_antenatal-0").click();
  }

  clickAddInsruanceDetails() {
    cy.get("[data-testid=add-insurance-button] button").check();
  }

  clickNoneMedicialHistory() {
    cy.get("[name=medical_history_check_1]").scrollIntoView();
    cy.get("[name=medical_history_check_1]").check();
  }

  clickCancelButton() {
    cy.get("#cancel").click();
  }

  typeMedicalHistory(index, text) {
    cy.get(`#medical_history_check_${index}`).click();
    cy.get(`#medical_history_${index}`).click().type(text);
  }

  selectPatientGender(gender: string) {
    cy.get("[data-testid=Gender] button")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(gender).click();
      });
  }

  selectPatientBloodGroup(bloodgroup: string) {
    cy.get("#blood_group")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(bloodgroup).click();
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

  verifyPatientPhoneNumber(phoneNumber: string) {
    cy.get("[data-testid=patient-dashboard]").should("contain", phoneNumber);
  }

  verifyPatientDashboardDetails(
    gender,
    age,
    patientName,
    phoneNumber,
    emergencyPhoneNumber,
    yearOfBirth,
    bloodGroup
  ) {
    cy.url().should("include", "/facility/");
    cy.get("[data-testid=patient-dashboard]").then(($dashboard) => {
      expect($dashboard).to.contain(gender);
      expect($dashboard).to.contain(age);
      expect($dashboard).to.contain(patientName);
      expect($dashboard).to.contain(phoneNumber);
      expect($dashboard).to.contain(emergencyPhoneNumber);
      expect($dashboard).to.contain(yearOfBirth);
      expect($dashboard).to.contain(bloodGroup);
    });
  }

  verifyPatientLocationDetails(
    patientAddress,
    patientPincode,
    patientState,
    patientDistrict,
    patientLocalbody,
    patientWard
  ) {
    cy.get("[data-testid=patient-details]").then(($dashboard) => {
      cy.url().should("include", "/facility/");
      expect($dashboard).to.contain(patientAddress);
      expect($dashboard).to.contain(patientPincode);
      expect($dashboard).to.contain(patientState);
      expect($dashboard).to.contain(patientDistrict);
      expect($dashboard).to.contain(patientLocalbody);
      expect($dashboard).to.contain(patientWard);
    });
  }

  verifyPatientMedicalDetails(
    patientPresentHealth,
    patientOngoingMedication,
    patientAllergies,
    patientSymptoms1,
    patientSymptoms2,
    patientSymptoms3,
    patientSymptoms4,
    patientSymptoms5,
    patientSymptoms6,
    patientSymptoms7
  ) {
    cy.get("[data-testid=patient-details]").then(($dashboard) => {
      cy.url().should("include", "/facility/");
      expect($dashboard).to.contain(patientPresentHealth);
      expect($dashboard).to.contain(patientOngoingMedication);
      expect($dashboard).to.contain(patientAllergies);
      expect($dashboard).to.contain(patientSymptoms1);
      expect($dashboard).to.contain(patientSymptoms2);
      expect($dashboard).to.contain(patientSymptoms3);
      expect($dashboard).to.contain(patientSymptoms4);
      expect($dashboard).to.contain(patientSymptoms5);
      expect($dashboard).to.contain(patientSymptoms6);
      expect($dashboard).to.contain(patientSymptoms7);
    });
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
