// UserCreation.ts
export class UserCreationPage {
  clickProfileName() {
    cy.get("#user-profile-name").click();
  }

  clickProfileButton() {
    cy.get("#profile-button").click();
  }

  clickEditCancelProfileButton() {
    cy.get("#edit-cancel-profile-button").click();
  }

  clickAddUserButton() {
    cy.get("#addUserButton").click();
  }
  clickSubmit() {
    cy.get("#submit").click();
  }

  typeIntoFirstNameAndClear() {
    cy.get("#firstName").click().clear().click().type("District Editted");
  }
  typeIntoLastNameAndClear() {
    cy.get("#lastName").click().clear().click().type("Cypress");
  }
  typeIntoPhoneNumberAndClear(phone_number: string) {
    cy.get("#phoneNumber").click().clear().click().type(phone_number);
  }
  typeIntoEmailAndClear() {
    cy.get("#email").click().clear().click().type("test@test.com");
  }
  typeIntoWeeklyWorkingHoursAndClear() {
    cy.get("#weekly_working_hours").click().clear().click().type("14");
  }

  typeIntoAltPhoneumberAndClear(emergency_phone_number: string) {
    cy.get("#altPhoneNumber")
      .click()
      .clear()
      .click()
      .type(emergency_phone_number);
  }

  typeIntoElementByIdPostClearDob(elementId: string, value: string) {
    cy.clickAndTypeDate("#" + elementId, value);
  }

  clearFirstName() {
    cy.get("#firstName").click().clear();
  }
  clearLastName() {
    cy.get("#lastName").click().clear();
  }
  clearPhoneNumber() {
    cy.get("#phoneNumber").click().clear();
  }
  clearAltPhoneNumber() {
    cy.get("#altPhoneNumber").click().clear();
  }
  clearWeeklyWorkingHours() {
    cy.get("#weekly_working_hours").click().clear();
  }

  typeUserName(username: string) {
    cy.get("#username").click().type(username);
  }
  typePassword() {
    cy.get("#password").click().type("Test@123");
  }
  typePhoneNumber(phone_number: string) {
    cy.get("#phone_number").click().type(phone_number);
  }
  typeConfirmPassword() {
    cy.get("#c_password").click().type("Test@123");
  }
  typeQualification() {
    cy.get("#qualification").click().type("MBBS");
  }
  typeDoctorExperience() {
    cy.get("#doctor_experience_commenced_on").click().type("2");
  }

  typeDoctorMedicalCouncilRegNo() {
    cy.get("#doctor_medical_council_registration").click().type("123456789");
  }

  typeFirstName() {
    cy.get("#first_name").click().type("cypress test");
  }
  typeLastName() {
    cy.get("#last_name").click().type("staff user");
  }
  typeEmail() {
    cy.get("#email").click().type("test@test.com");
  }

  typeIntoInputByName(inputName: string, value: string) {
    cy.get("input[name='" + inputName + "']")
      .click()
      .type(value);
  }
  selectOptionContainingText(text: string) {
    cy.get("[role='option']").contains(text).click();
  }
  selectFacility(name: string) {
    this.typeIntoInputByName("facilities", name);
    this.selectOptionContainingText(name);
    cy.get("input[name='facilities'] + button")
      .find("#dropdown-toggle")
      .click();
  }

  selectHomeFacility(name: string) {
    cy.get("#home_facility").click();
    this.selectOptionContainingText(name);
  }

  verifyErrorMessages(errorMessages: string[]) {
    cy.get(".error-text").then(($errors) => {
      const displayedErrorMessages = $errors
        .map((_, el) => Cypress.$(el).text())
        .get();
      errorMessages.forEach((errorMessage) => {
        expect(displayedErrorMessages).to.include(errorMessage);
      });
    });
  }
}
