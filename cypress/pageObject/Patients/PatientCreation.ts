export interface PatientFormData {
  name: string;
  phoneNumber: string;
  gender: "male" | "female" | "transgender" | "non_binary";
  bloodGroup:
    | "Unknown"
    | "A+"
    | "A-"
    | "B+"
    | "B-"
    | "AB+"
    | "AB-"
    | "O+"
    | "O-"
    | "Unknown";
  dateOfBirth?: string;
  age?: string;
  address: string;
  sameAsPermanentAddress?: boolean; // true by default
  permanentAddress?: string;
  hasEmergencyContact?: boolean; // false by default
  emergencyPhoneNumber?: string;
  pincode: string;
  localBody: string;
  ward: string;
  state: string;
  district: string;
}

export class PatientCreation {
  // Selectors
  private selectors = {
    patientsButton: '[data-cy="patients-button"]',
    searchInput: "#patient-search",
    patientCard: "#patient-search-results",
    createNewPatientButton: '[data-cy="create-new-patient-button"]',
    nameInput: '[data-cy="patient-name-input"]',
    phoneInput: '[data-cy="patient-phone-input"]',
    dobDayInput: '[data-cy="dob-day-input"]',
    dobMonthInput: '[data-cy="dob-month-input"]',
    dobYearInput: '[data-cy="dob-year-input"]',
    ageInput: '[data-cy="age-input"]',
    genderRadio: '[data-cy="gender-radio-{value}"]',
    bloodGroupSelect: '[data-cy="blood-group-select"]',
    addressInput: '[data-cy="current-address-input"]',
    sameAddressCheckbox: '[data-cy="same-address-checkbox"]',
    permanentAddressInput: '[data-cy="permanent-address-input"]',
    emergencyContactCheckbox: '[data-cy="same-phone-number-checkbox"]',
    emergencyPhoneInput: '[data-cy="patient-emergency-phone-input"]',
    pincodeInput: '[data-cy="pincode-input"]',
    localBodySelect: '[data-cy="select-local_body"]',
    wardSelect: '[data-cy="select-ward"]',
    submitButton: '[data-cy="submit-button"]',
    samePhoneNumberCheckbox: '[data-cy="same-phone-number-checkbox"]',
    stateSelect: '[data-cy="select-state"]',
    districtSelect: '[data-cy="select-district"]',
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
    cy.verifyContentPresence(this.selectors.patientCard, detailsArray);
  }

  clickSearchPatients() {
    cy.get('[data-sidebar="content"]').contains("Search Patients").click();
    return this;
  }

  enterName(name: string) {
    cy.get(this.selectors.nameInput).type(name);
    return this;
  }

  enterPhoneNumber(phoneNumber: string) {
    cy.typeIntoField(this.selectors.phoneInput, phoneNumber, {
      skipVerification: true,
    });
    return this;
  }

  enterDateOfBirth(dateString: string) {
    // Split the date string (expected format: "DD-MM-YYYY")
    const [day, month, year] = dateString.split("-");

    cy.get(this.selectors.dobDayInput).type(day);
    cy.get(this.selectors.dobMonthInput).type(month);
    cy.get(this.selectors.dobYearInput).type(year);

    return this;
  }

  selectGender(gender: string) {
    const lowercaseGender = gender.toLowerCase();
    cy.get(
      this.selectors.genderRadio.replace("{value}", lowercaseGender),
    ).click();
    return this;
  }

  selectBloodGroup(bloodGroup: string) {
    cy.clickAndSelectOption(this.selectors.bloodGroupSelect, bloodGroup);
    return this;
  }

  enterAddress(address: string) {
    cy.typeIntoField(this.selectors.addressInput, address);
    return this;
  }

  enterPincode(pincode: string) {
    cy.typeIntoField(this.selectors.pincodeInput, pincode);
    return this;
  }

  fillPatientDetails(data: PatientFormData) {
    this.enterName(data.name)
      .enterPhoneNumber(data.phoneNumber)
      .selectGender(data.gender)
      .selectBloodGroup(data.bloodGroup);

    // Handle DOB or Age
    if (data.dateOfBirth) {
      this.enterDateOfBirth(data.dateOfBirth);
    } else if (data.age) {
      cy.get('[data-cy="age-tab"]').click();
      cy.get(this.selectors.ageInput).type(data.age);
    }

    // Handle permanent address
    if (data.sameAsPermanentAddress === false) {
      cy.get(this.selectors.sameAddressCheckbox).click();
      this.enterPermanentAddress(data.permanentAddress!);
    }

    this.enterAddress(data.address);

    // Handle emergency contact - Fixed logic
    if (data.hasEmergencyContact) {
      // If hasEmergencyContact is true, just enter the emergency phone number
      if (data.emergencyPhoneNumber) {
        this.enterEmergencyPhone(data.emergencyPhoneNumber);
      }
    } else {
      // If hasEmergencyContact is false, click the checkbox to disable emergency contact
      cy.get(this.selectors.emergencyContactCheckbox).click();
    }

    this.enterPincode(data.pincode)
      .selectState(data.state)
      .selectDistrict(data.district)
      .selectLocalBody(data.localBody)
      .selectWard(data.ward);

    return this;
  }

  selectLocalBody(localBody: string) {
    cy.typeAndSelectOption(this.selectors.localBodySelect, localBody, false);
    return this;
  }

  selectWard(ward: string) {
    cy.typeAndSelectOption(this.selectors.wardSelect, ward);
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

  enterPermanentAddress(address: string) {
    cy.typeIntoField(this.selectors.permanentAddressInput, address);
    return this;
  }

  enterEmergencyPhone(phoneNumber: string) {
    cy.typeIntoField(this.selectors.emergencyPhoneInput, phoneNumber, {
      skipVerification: true,
    });
    return this;
  }

  selectState(state: string) {
    cy.get(this.selectors.stateSelect).then(($el) => {
      if ($el.val() !== state) {
        cy.typeAndSelectOption(this.selectors.stateSelect, state);
      }
    });
    return this;
  }

  selectDistrict(district: string) {
    cy.get(this.selectors.districtSelect).then(($el) => {
      if ($el.val() !== district) {
        cy.typeAndSelectOption(this.selectors.districtSelect, district);
      }
    });
    return this;
  }
}

export const patientCreation = new PatientCreation();
