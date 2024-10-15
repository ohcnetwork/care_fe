export class DoctorConnect {
  clickDoctorConnectButton() {
    cy.get("#doctor-connect-button").scrollIntoView();
    cy.get("#doctor-connect-button").click();
  }

  CopyFunctionTrigger() {
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, "writeText").as("clipboardStub");
    });
  }

  verifyCopiedContent(text: string) {
    cy.get("@clipboardStub").should("be.calledWith", text);
  }

  verifyIconVisible(selector: string) {
    cy.get(selector).should("be.visible");
  }

  clickCopyPhoneNumber(element: string, text: string) {
    cy.get(element)
      .contains(text) // Find the element containing "dev doctor"
      .parent() // Move up to the parent element (if necessary)
      .find("#copy-phoneicon") // Find the #copy-phoneicon within that context
      .click();
  }

  clickUsersSortBy(text: string) {
    cy.get("#doctor-connect-filter-tabs").contains(text).click();
  }
}
