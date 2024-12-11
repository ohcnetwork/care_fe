export default class UserProfilePage {
  assertVideoConnectLink(link: string) {
    cy.get("#videoconnectlink-profile-details").should("contain.text", link);
  }

  clickEditProfileButton() {
    cy.get("#edit-cancel-profile-button").click();
  }

  typeVideoConnectLink(link: string) {
    cy.get("#video_connect_link").click().clear().type(link);
  }

  interceptUpdateUsers() {
    cy.intercept("PATCH", "/api/v1/users/*").as("updateUser");
  }

  verifyUpdateUsersResponse() {
    cy.wait("@updateUser").its("response.statusCode").should("eq", 200);
  }

  clickUpdateButton() {
    cy.clickSubmitButton("Update");
  }

  typeDateOfBirth(dob: string) {
    cy.clickAndTypeDate("#date_of_birth", dob);
  }

  clearPhoneNumber() {
    cy.get("#phoneNumber").click().clear();
  }
  clearAltPhoneNumber() {
    cy.get("#altPhoneNumber").click().clear();
  }
  clearWorkingHours() {
    cy.get("#weekly_working_hours").click().clear();
  }
  clearEmail() {
    cy.get("#email").click().clear();
  }

  selectGender(gender: string) {
    cy.get("#gender").click();
    cy.get("#gender-option-" + gender).click();
  }

  typeEmail(email: string) {
    cy.get("#email").click().clear().type(email);
  }

  typePhoneNumber(phone: string) {
    cy.get("#phoneNumber").click().clear().type(phone);
  }

  typeWhatsappNumber(phone: string) {
    cy.get("#altPhoneNumber").click().clear().type(phone);
  }

  typeWorkingHours(workingHours: string) {
    cy.get("#weekly_working_hours").click().clear().type(workingHours);
  }

  typeQualification = (qualification: string) => {
    cy.get("#qualification").click().clear().type(qualification);
  };

  typeDoctorYoE = (doctorYoE: string) => {
    cy.get("#doctor_experience_commenced_on").click().clear().type(doctorYoE);
  };

  typeMedicalCouncilRegistration = (medicalCouncilRegistration: string) => {
    cy.get("#doctor_medical_council_registration")
      .click()
      .clear()
      .type(medicalCouncilRegistration);
  };

  assertDateOfBirth(dob: string) {
    cy.get("#date_of_birth-profile-details").should("contain.text", dob);
  }

  assertGender(gender: string) {
    cy.get("#gender-profile-details").should("contain.text", gender);
  }

  assertEmail(email: string) {
    cy.get("#emailid-profile-details").should("contain.text", email);
  }

  assertPhoneNumber(phone: string) {
    cy.get("#contactno-profile-details").should("contain.text", phone);
  }

  assertAltPhoneNumber(phone: string) {
    cy.get("#whatsapp-profile-details").should("contain.text", phone);
  }

  assertWorkingHours(workingHours: string) {
    cy.get("#averageworkinghour-profile-details").should(
      "contain.text",
      workingHours,
    );
  }
}
