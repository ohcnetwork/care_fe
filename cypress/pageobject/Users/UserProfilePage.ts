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

  clickUpdateButton() {
    cy.get("#submit").click();
  }

  typeAge(age: string) {
    cy.get("#age").click().clear().type(age);
  }

  selectGender(gender: string) {
    cy.get("#gender").click();
    cy.get("#gender-option-" + gender).click();
  }

  typeEmail(email: string) {
    cy.get("#email").click().clear().type(email);
  }

  typePhone(phone: string) {
    cy.get("#phoneNumber").click().clear().type(phone);
  }

  typeWhatsApp(phone: string) {
    cy.get("#altPhoneNumber").click().clear().type(phone);
  }

  typeWorkingHours(workinghours: string) {
    cy.get("#weekly_working_hours").click().clear().type(workinghours);
  }

  typeDoctorQualification = (doctorQualification: string) => {
    cy.get("#doctor_qualification").click().clear().type(doctorQualification);
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

  assertAge(age: string) {
    cy.get("#age-profile-details").should("contain.text", age);
  }

  assertGender(gender: string) {
    cy.get("#gender-profile-details").should("contain.text", gender);
  }

  assertEmail(email: string) {
    cy.get("#emailid-profile-details").should("contain.text", email);
  }

  assertPhone(phone: string) {
    cy.get("#contactno-profile-details").should("contain.text", phone);
  }

  assertWhatsApp(phone: string) {
    cy.get("#whatsapp-profile-details").should("contain.text", phone);
  }

  assertWorkingHours(workinghours: string) {
    cy.get("#averageworkinghour-profile-details").should(
      "contain.text",
      workinghours
    );
  }
}
