export default class UserProfilePage {
  clickSubmit() {
    cy.get("#submit").click();
  }
  typeDateOfBirth(dob: string) {
    cy.clickAndTypeDate("#date_of_birth", dob);
  }

  typeEmail(email: string) {
    cy.get("#email").click().clear().type(email);
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
}
