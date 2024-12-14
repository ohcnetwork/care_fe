// UserCreation.ts
export class UserCreationPage {
  clickAddUserButton() {
    cy.verifyAndClickElement("#addUserButton", "Add New User");
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
  typePassword(password: string) {
    cy.get("#password").click().type(password);
  }
  typeConfirmPassword(password: string) {
    cy.get("#c_password").click().type(password);
  }
  clearFirstName() {
    cy.get("#firstName").click().clear();
  }
  clearLastName() {
    cy.get("#lastName").click().clear();
  }
  selectUserType(role: string) {
    cy.clickAndSelectOption("#user_type", role);
  }
  selectHomeFacility(name: string) {
    cy.clickAndSelectOption("#home_facility", name);
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
    cy.typeAndSelectOption("input[name='facilities']", name);
  }

  clickSaveUserButton() {
    cy.clickSubmitButton("Submit");
  }
}
