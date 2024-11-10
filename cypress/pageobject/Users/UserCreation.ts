// UserCreation.ts
export class UserCreationPage {
  clickProfileName() {
    cy.get("#user-profile-name").click();
  }
  clickProfileButton() {
    cy.get("#profile-button").click();
  }
  clickEditProfileButton() {
    cy.get("#edit-cancel-profile-button").click();
  }
  clickAddUserButton() {
    cy.get("#addUserButton").click();
  }
  clickSubmitButton() {
    cy.get("#submit").click();
  }

  typeUserName(username: string) {
    cy.get("#username").click().type(username);
  }
  typeFirstName(firstName: string) {
    cy.get("#firstName").click().type(firstName);
  }
  typeLastName(lastName: string) {
    cy.get("#lastName").click().type(lastName);
  }
  typeEmail(email: string) {
    cy.get("#email").click().type(email);
  }

  typePassword(password: string) {
    cy.get("#password").click().type(password);
  }
  typePhoneNumber(phone_number: string) {
    cy.get("#phoneNumber").click().type(phone_number);
  }
  typeConfirmPassword(password: string) {
    cy.get("#c_password").click().type(password);
  }
  typeQualification(qualification: string) {
    cy.get("#qualification").click().type(qualification);
  }
  typeDoctorExperience(experince: string) {
    cy.get("#doctor_experience_commenced_on").click().type(experince);
  }

  typeDoctorMedicalCouncilRegNo(regNo: string) {
    cy.get("#doctor_medical_council_registration").click().type(regNo);
  }

  typeWeeklyWorkingHours(workingHrs: string) {
    cy.get("#weekly_working_hours").click().type(workingHrs);
  }

  typeAltPhoneumber(emergencyPhoneNumber: string) {
    cy.get("#altPhoneNumber").click().type(emergencyPhoneNumber);
  }

  typeIntoInputByName(inputName: string, value: string) {
    cy.get("input[name='" + inputName + "']")
      .click()
      .type(value);
  }
  typeDateOfBirth(dob: string) {
    cy.clickAndTypeDate("#date_of_birth", dob);
  }
  typeNewUserFirstName(firstName: string) {
    cy.get("#first_name").click().type(firstName);
  }
  typeNewUserLastName(lastName: string) {
    cy.get("#last_name").click().type(lastName);
  }
  typeNewUserPhoneNumber(phoneNumber: string) {
    cy.get("#phone_number").click().type(phoneNumber);
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
  clearEmail() {
    cy.get("#email").click().clear();
  }

  selectUserType(role: string) {
    cy.clickAndSelectOption("#user_type", role);
  }

  selectHomeFacility(name: string) {
    cy.get("#home_facility").click();
    this.selectOptionContainingText(name);
  }
  selectGender(gender: string) {
    cy.clickAndSelectOption("#gender", gender);
  }
  selectState(state: string) {
    cy.clickAndSelectOption("#state", state);
  }
  selectDistrict(district: string) {
    cy.clickAndSelectOption("#district", district);
  }
  selectFacility(name: string) {
    this.typeIntoInputByName("facilities", name);
    this.selectOptionContainingText(name);
    cy.get("input[name='facilities'] + button")
      .find("#dropdown-toggle")
      .click();
  }

  selectOptionContainingText(text: string) {
    cy.get("[role='option']").contains(text).click();
  }

  verifyElementContainsText(elementId: string, expectedText: string) {
    cy.get("#" + elementId).should("contain.text", expectedText);
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
