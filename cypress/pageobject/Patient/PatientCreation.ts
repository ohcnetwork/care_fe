// PatientPage.ts

let patient_url = "";

export class PatientPage {
  createPatient() {
    cy.intercept("GET", "**/api/v1/facility/**").as("getFacilities");
    cy.get("#add-patient-details").should("be.visible");
    cy.get("#add-patient-details").click();
    cy.wait("@getFacilities").its("response.statusCode").should("eq", 200);
  }

  visitPatient(patientName: string) {
    cy.get("#name").click().type(patientName);
    cy.intercept("GET", "**/api/v1/consultation/**").as("getPatient");
    cy.get("#patient-name-list").contains(patientName).click();
    cy.wait(2000);
    cy.wait("@getPatient").its("response.statusCode").should("eq", 200);
    cy.get("#patient-name-consultation")
      .should("be.visible")
      .contains(patientName);
  }

  selectFacility(facilityName: string) {
    cy.typeAndSelectOption("input[name='facilities']", facilityName);
    cy.clickSubmitButton("Select");
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
    cy.get("#phone_number").click().type(phoneNumber);
  }

  typePatientEmergencyNumber(phoneNumber: string) {
    cy.get("#emergency_phone_number").click().type(phoneNumber);
  }

  checkPhoneNumberIsEmergencyNumber() {
    cy.get("#emergency_contact_checkbox").click();
  }

  typePatientDateOfBirth(dateOfBirth: string) {
    cy.clickAndSelectOption("#patientAge", "DOB");
    cy.clickAndTypeDate("#date_of_birth", dateOfBirth);
  }

  typePatientAge(age: string) {
    cy.clickAndSelectOption("#patientAge", "Age");
    cy.clickSubmitButton("Confirm");
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

  typeLastMenstruationStartDate(date: string) {
    cy.clickAndTypeDate("#last_menstruation_start_date", date);
  }

  typeDateOfDelivery(date: string) {
    cy.clickAndTypeDate("#date_of_delivery", date);
  }

  clickPermanentAddress() {
    cy.get("[data-testid=permanent-address] input").check();
  }

  clickPatientAntenatalStatusYes() {
    cy.get("#is_antenatal-option-true").click();
  }

  clickPatientPostPartumStatusYes() {
    cy.get("#is_postpartum-option-true").click();
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
    cy.typeAndSelectOption("#occupation", occupation);
  }

  selectSocioeconomicStatus(value: string) {
    cy.selectRadioOption("socioeconomic_status", value);
  }

  selectDomesticHealthcareSupport(value: string) {
    cy.selectRadioOption("domestic_healthcare_support", value);
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
    gender: string,
    age: number,
    patientName: string,
    phoneNumber: string,
    emergencyPhoneNumber: string,
    yearOfBirth: string,
    bloodGroup: string,
    occupation: string,
    socioeconomicStatus: string | null = null,
    domesticHealthcareSupport: string | null = null,
    isAntenatal = false,
    isPostPartum = false,
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
      socioeconomicStatus && expect($dashboard).to.contain(socioeconomicStatus);
      domesticHealthcareSupport &&
        expect($dashboard).to.contain(domesticHealthcareSupport);

      if (isAntenatal) {
        expect($dashboard).to.contain("Antenatal");
      }
      if (isPostPartum) {
        expect($dashboard).to.contain("Post-partum");
      }
    });
  }

  verifyPatientLocationDetails(
    patientAddress: string,
    patientPincode: number,
    patientState: string,
    patientDistrict: string,
    patientLocalbody: string,
    patientWard: string,
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

  clickPatientUpdateDetails() {
    cy.verifyAndClickElement("#update-patient-details", "Update Details");
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
