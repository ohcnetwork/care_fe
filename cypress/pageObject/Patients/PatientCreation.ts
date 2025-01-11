interface PatientFormData {
  name: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  address: string;
  pincode: string;
  state: string;
  district: string;
  localBody: string;
  ward: string;
}

export class PatientCreation {
  // Selectors
  private selectors = {
    patientsButton: '[data-cy="patients-button"]',
    searchInput: "#patient-search",
    patientCard: "#patient-search-results",
    patientName: '[data-cy="patient-name"]',
    patientDetails: "#patient-search-results",
    createNewPatientButton: '[data-cy="create-new-patient-button"]',
  };

  // Actions
  clickCreateNewPatient() {
    cy.get(this.selectors.createNewPatientButton).click();
    cy.url().should("include", "/patient/create");
    return this;
  }

  searchPatient(searchQuery: string) {
    cy.get(this.selectors.searchInput).type(searchQuery);

    // Wait for results to load
    cy.get(this.selectors.patientCard).should("be.visible");
    return this;
  }

  verifySearchResults(patientDetails: {
    name: string;
    sex: string;
    phone: string;
  }) {
    // Convert object values to an array of strings
    const detailsArray = Object.values(patientDetails);
    cy.verifyContentPresence(this.selectors.patientDetails, detailsArray);
  }

  selectFacility(facilityName: string) {
    cy.verifyAndClickElement("[data-cy='facility-list']", facilityName);
    return this;
  }

  clickSearchPatients() {
    cy.get('[data-sidebar="content"]').contains("Search Patients").click();
    return this;
  }

  enterName(name: string) {
    cy.typeIntoField('[data-cy="patient-name-input"]', name);
    return this;
  }

  enterPhoneNumber(phoneNumber: string) {
    cy.typeIntoField('[data-cy="patient-phone-input"]', phoneNumber, {
      skipVerification: true,
    });
    return this;
  }

  enterDateOfBirth(dateString: string) {
    // Split the date string (expected format: "DD-MM-YYYY")
    const [day, month, year] = dateString.split("-");

    cy.get('[data-cy="dob-day-input"]').type(day);
    cy.get('[data-cy="dob-month-input"]').type(month);
    cy.get('[data-cy="dob-year-input"]').type(year);

    return this;
  }

  selectGender(gender: string) {
    const lowercaseGender = gender.toLowerCase();
    cy.get(`[data-cy="gender-radio-${lowercaseGender}"]`).click();
    return this;
  }

  selectBloodGroup(bloodGroup: string) {
    cy.clickAndSelectOption('[data-cy="blood-group-select"]', bloodGroup);
    return this;
  }

  enterAddress(address: string) {
    cy.typeIntoField('[data-cy="current-address-input"]', address);
    return this;
  }

  enterPincode(pincode: string) {
    cy.typeIntoField('[data-cy="pincode-input"]', pincode);
    return this;
  }

  fillPatientDetails(patient: PatientFormData) {
    return this.enterName(patient.name)
      .enterPhoneNumber(patient.phoneNumber)
      .clickSamePhoneNumberCheckbox()
      .selectGender(patient.gender)
      .selectBloodGroup(patient.bloodGroup)
      .enterDateOfBirth(patient.dateOfBirth)
      .enterAddress(patient.address)
      .enterPincode(patient.pincode)
      .selectState(patient.state)
      .selectDistrict(patient.district)
      .selectLocalBody(patient.localBody)
      .selectWard(patient.ward);
  }

  selectState(state: string) {
    cy.typeAndSelectOption('[data-cy="select-state"]', state);
    return this;
  }

  selectDistrict(district: string) {
    cy.typeAndSelectOption('[data-cy="select-district"]', district);
    return this;
  }

  selectLocalBody(localBody: string) {
    cy.typeAndSelectOption('[data-cy="select-local_body"]', localBody);
    return this;
  }

  selectWard(ward: string) {
    cy.typeAndSelectOption('[data-cy="select-ward"]', ward);
    return this;
  }

  submitPatientForm() {
    cy.clickSubmitButton("Save and Continue");
    return this;
  }

  clickSamePhoneNumberCheckbox() {
    cy.get('[data-cy="same-phone-number-checkbox"]').click();
    return this;
  }

  assertPatientRegistrationSuccess() {
    cy.verifyNotification("Patient Registered Successfully");
    return this;
  }
}

export const patientCreation = new PatientCreation();
