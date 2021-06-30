Cypress.Commands.add("verifyNotification", (text) => {
  cy.get(".pnotify-container").should("exist").contains(text);
  cy.get(".pnotify-container").click();
});

declare namespace Cypress {
  interface Chainable<Subject = any> {
    verifyNotification(text: String): Chainable<Subject>;
  }
}
