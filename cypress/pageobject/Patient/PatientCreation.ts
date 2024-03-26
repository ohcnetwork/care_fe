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
    cy.searchAndSelectOption("input[name='facilities']", facilityName);
    cy.submitButton("Select");
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
    cy.clickAndSelectOption("#patientAge", "D.O.B");
    cy.get("#date_of_birth").scrollIntoView();
    cy.get("#date_of_birth").should("be.visible").click();
    cy.get("#date-input").click().type(dateOfBirth);
  }

  typePatientAge(age: string) {
    cy.clickAndSelectOption("#patientAge", "Age");
    cy.submitButton("Confirm");
    cy.get("#age").clear().type(age);
  }

  typePatientName(patientName: string) {
    cy.get("[data-testid=name] input").click().type(patientName);
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

  clickPermanentAddress() {
    cy.get("[data-testid=permanent-address] input").check();
  }

  clickPatientAntenatalStatusYes() {
    cy.get("#is_antenatal-0").click();
  }

  clickCancelButton() {
    cy.get("#cancel").click();
  }

  selectPatientGender(gender: string) {
    cy.clickAndSelectOption("[data-testid=Gender] button", gender);
  }

  selectPatientBloodGroup(bloodgroup: string) {
    cy.clickAndSelectOption("#blood_group", bloodgroup);
  }

  selectPatientOccupation(occupation: string) {
    cy.clickAndSelectOption("#occupation", occupation);
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

  savePatientUrl() {
    cy.url().then((url) => {
      patient_url = url;
    });
  }

  visitPatientUrl() {
    cy.visit(patient_url);
  }

  visitConsultationPage() {
    cy.visit(patient_url + "/consultation");
  }

  clickUpdatePatient() {
    cy.intercept("PUT", "**/api/v1/patient/**").as("updatePatient");
    cy.get("button").get("[data-testid=submit-button]").click();
    cy.wait("@updatePatient").its("response.statusCode").should("eq", 200);
  }

  verifyPatientUpdated() {
    cy.url().should("include", "/patient");
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
    bloodGroup,
    occupation,
    DobOrAge
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
      expect($dashboard).to.contain(occupation);
      expect($dashboard).to.contain(DobOrAge);
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

  visitUpdatePatientUrl() {
    cy.visit(patient_url + "/update");
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
