// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

import "./crud/patient_crud";
import "./crud/facility_crud";

Cypress.Commands.add("login", (username, password) => {
  cy.log(`Logging in the user: ${username}:${password}`);

  cy.visit("http://localhost:4000/");
  cy.get('input[name="username"]').type(username);
  cy.get('input[name="password"]').type(password);
  cy.get("button").contains("Login").click();

  cy.url().should("include", "/facility");
});

Cypress.Commands.add("verifyNotification", (text) => {
  cy.get(".pnotify-container").should("exist").contains(text);
  cy.get(".pnotify-container").click();
});
