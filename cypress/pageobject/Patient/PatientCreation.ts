// PatientPage.ts
import FacilityPage from "pageobject/Facility/FacilityCreation";

import PatientMedicalHistory from "./PatientMedicalHistory";

const facilityPage = new FacilityPage();
const patientMedicalHistory = new PatientMedicalHistory();

export interface PatientData {
  facility: string;
  phoneNumber: string;
  isEmergencyNumber?: boolean;
  age: string | number;
  name: string;
  gender: string;
  address: string;
  pincode: string;
  state: string;
  district: string;
  localBody: string;
  ward: string;
  occupation?: string;
  socioeconomicStatus?: string;
  domesticHealthcareSupport?: string;
  medicalHistory?: {
    presentHealth?: string;
    ongoingMedication?: string;
    conditions?: { index: number; condition: string }[];
    allergies?: string;
  };
  bloodGroup?: string;
}

export class PatientPage {
  createPatient() {
    cy.intercept("GET", "**/api/v1/facility/**").as("getFacilities");
    cy.get("#add-patient-details").should("be.visible");
    cy.get("#add-patient-details").click();
    cy.wait("@getFacilities").its("response.statusCode").should("eq", 200);
  }

  visitPatient(patientName: string) {
    cy.get('[data-test-id="patient-search__name"]').click();
    cy.get("#patient-search").click().type(patientName); // Type the patient name
    cy.intercept("GET", "**/api/v1/consultation/**").as("getPatient");
    cy.get("#patient-name-list").contains(patientName).click();
    cy.wait("@getPatient").its("response.statusCode").should("eq", 200);
    cy.get("#patient-name-consultation")
      .should("be.visible")
      .contains(patientName);
  }

  visitPatientWithNoConsultation(patientName: string) {
    cy.get("#name").click().type(patientName);
    cy.intercept("GET", "**/api/v1/patient/**").as("getPatient");
    cy.get("#patient-name-list").contains(patientName).click();
    cy.wait("@getPatient").its("response.statusCode").should("eq", 200);
    cy.get("#patient-name").should("be.visible").contains(patientName);
    cy.get("#create-consultation").should("be.visible");
    this.clickCreateConsultationOnPatientPageWithNoConsultation();
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
    cy.clickAndSelectOption("#patientAge", "Age", true);
    cy.clickSubmitButton("Confirm");
    cy.get("#age").clear().type(age);
  }

  typePatientName(patientName: string) {
    cy.get("[data-testid=name] input").click().type(patientName);
  }

  typePatientNameList(patientName: string) {
    cy.get('[data-test-id="patient-search__name"]').click();
    cy.get("#patient-search").click().type(patientName);
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
    cy.intercept("GET", "**/api/v1/patient/*/").as("getPatient");
    cy.get("#cancel").click();
    cy.wait("@getPatient");
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

  clickUpdatePatient() {
    cy.intercept("PUT", "**/api/v1/patient/**").as("updatePatient");
    cy.get("button").get("[data-testid=submit-button]").click();
    cy.wait("@updatePatient").its("response.statusCode").should("eq", 200);
  }

  interceptGetPatient() {
    cy.intercept("GET", "**/api/v1/patient/*").as("getPatient");
  }

  verifyGetPatientResponse() {
    cy.wait("@getPatient").its("response.statusCode").should("eq", 200);
  }

  clickCreateConsultationOnPatientPageWithNoConsultation() {
    cy.get("#create-consultation").should("be.visible").click();
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
    cy.get("[data-testid=patient-dashboard]")
      .should("be.visible")
      .then(($dashboard) => {
        expect($dashboard).to.contain(gender);
        expect($dashboard).to.contain(age);
        expect($dashboard).to.contain(phoneNumber);
        expect($dashboard).to.contain(emergencyPhoneNumber);
        expect($dashboard).to.contain(yearOfBirth);
        expect($dashboard).to.contain(bloodGroup);
        expect($dashboard).to.contain(occupation);
        socioeconomicStatus &&
          expect($dashboard).to.contain(socioeconomicStatus);
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

  clickPatientUpdateDetails() {
    cy.verifyAndClickElement("#update-patient-details", "Edit Profile");
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

  createPatientWithData(data: PatientData) {
    this.createPatient();
    this.selectFacility(data.facility);
    this.patientformvisibility();

    this.typePatientPhoneNumber(data.phoneNumber);
    if (data.isEmergencyNumber) {
      this.checkPhoneNumberIsEmergencyNumber();
    }
    this.typePatientAge(data.age.toString());
    this.typePatientName(data.name);
    this.selectPatientGender(data.gender);
    this.typePatientAddress(data.address);

    facilityPage.fillPincode(data.pincode);
    facilityPage.selectStateOnPincode(data.state);
    facilityPage.selectDistrictOnPincode(data.district);
    facilityPage.selectLocalBody(data.localBody);
    facilityPage.selectWard(data.ward);

    if (data.occupation) {
      this.selectPatientOccupation(data.occupation);
    }
    if (data.socioeconomicStatus) {
      this.selectSocioeconomicStatus(data.socioeconomicStatus);
    }
    if (data.domesticHealthcareSupport) {
      this.selectDomesticHealthcareSupport(data.domesticHealthcareSupport);
    }

    if (data.medicalHistory) {
      if (data.medicalHistory.presentHealth) {
        patientMedicalHistory.typePatientPresentHealth(
          data.medicalHistory.presentHealth,
        );
      }
      if (data.medicalHistory.ongoingMedication) {
        patientMedicalHistory.typePatientOngoingMedication(
          data.medicalHistory.ongoingMedication,
        );
      }
      if (data.medicalHistory.conditions) {
        data.medicalHistory.conditions.forEach(({ index, condition }) => {
          patientMedicalHistory.typeMedicalHistory(index, condition);
        });
      }
      if (data.medicalHistory.allergies) {
        patientMedicalHistory.typePatientAllergies(
          data.medicalHistory.allergies,
        );
      }
    }

    if (data.bloodGroup) {
      this.selectPatientBloodGroup(data.bloodGroup);
    }

    this.clickCreatePatient();
    this.verifyPatientIsCreated();
  }
}
