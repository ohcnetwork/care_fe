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

  typedate_of_birth(date_of_birth: string) {
    cy.clickAndTypeDate("#date_of_birth", date_of_birth);
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

  assertdate_of_birth(date_of_birth: string) {
    cy.get("#date_of_birth-profile-details").should(
      "contain.text",
      date_of_birth,
    );
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
      workinghours,
    );
  }
}
