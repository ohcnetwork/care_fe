/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
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
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

import cypress = require("cypress");
import "cypress-localstorage-commands";

Cypress.Commands.add("login", (username, password) => {
  cy.log(`Logging in the user: ${username}:${password}`);
  cy.visit("http://localhost:4000/");
  cy.get('input[name="username"]').type(username);
  cy.get('input[name="password"]').type(password);
  cy.get("button").contains("Login").click();
  cy.wait(1000);
  return cy.url().should("include", "/facility");
});

Cypress.Commands.add("refreshApiLogin", (username, password) => {
  cy.request({
    method: "POST",
    url: "/api/v1/auth/login/",
    body: {
      username,
      password,
    },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200) {
      cy.writeFile("cypress/fixtures/token.json", {
        username: username,
        access: response.body.access,
        refresh: response.body.refresh,
      });
      cy.setLocalStorage("care_access_token", response.body.access);
      cy.setLocalStorage("care_refresh_token", response.body.refresh);
    } else {
      cy.log("An error occurred while logging in");
    }
  });
});

Cypress.Commands.add("loginByApi", (username, password) => {
  cy.log(`Logging in the user: ${username}:${password}`);
  cy.task("readFileMaybe", "cypress/fixtures/token.json")
    .then((tkn) => {
      const token = JSON.parse(tkn);
      if (tkn && token.access && token.username === username) {
        cy.request({
          method: "POST",
          url: "/api/v1/auth/token/verify/",
          body: {
            token: token.access,
          },
          headers: {
            "Content-Type": "application/json",
          },
          failOnStatusCode: false,
        }).then((response) => {
          if (response.status === 200) {
            cy.setLocalStorage("care_access_token", token.access);
            cy.setLocalStorage("care_refresh_token", token.refresh);
          } else {
            cy.refreshApiLogin(username, password);
          }
        });
      } else {
        cy.refreshApiLogin(username, password);
      }
    })
    .then(() => {
      cy.visit("/");
      return cy.url().should("include", "/facility");
    });
});

Cypress.Commands.add("verifyNotification", (text) => {
  cy.get(".pnotify-container").should("exist").contains(text);
  return cy.get(".pnotify-container").click();
});
