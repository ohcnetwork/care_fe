// UserCreation.ts
export class UserCreationPage {
  clickElementById(elementId: string) {
    cy.get("#" + elementId).click();
  }

  typeIntoElementById(elementId: string, value: string) {
    cy.get("#" + elementId)
      .click()
      .type(value);
  }

  typeIntoElementByIdPostClear(elementId: string, value: string) {
    cy.get("#" + elementId)
      .click()
      .clear()
      .click()
      .type(value);
  }
  typeIntoElementByIdPostClearDob(elementId: string, value: string) {
    cy.clickAndTypeDate("#" + elementId, value);
  }
  clearIntoElementById(elementId: string) {
    cy.get("#" + elementId)
      .click()
      .clear();
  }

  typeIntoInputByName(inputName: string, value: string) {
    cy.get("input[name='" + inputName + "']")
      .click()
      .type(value);
  }

  selectOptionContainingText(text: string) {
    cy.get("[role='option']").contains(text).click();
  }

  verifyNotification(message: string) {
    cy.verifyNotification(message);
  }

  selectFacility(name: string) {
    this.typeIntoInputByName("facilities", name);
    this.selectOptionContainingText(name);
    cy.get("input[name='facilities'] + button")
      .find("#dropdown-toggle")
      .click();
  }

  selectHomeFacility(name: string) {
    this.clickElementById("home_facility");
    this.selectOptionContainingText(name);
  }

  setInputDate(dateElementId: string, dateValue: string) {
    cy.clickAndTypeDate("#" + dateElementId, dateValue);
  }

  selectDropdownOption(dropdownId: string, optionText: string) {
    this.clickElementById(dropdownId);
    this.selectOptionContainingText(optionText);
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
