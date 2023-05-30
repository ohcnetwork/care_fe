import "cypress-localstorage-commands";

import { Cypress, cy } from "local-cypress";

Cypress.Commands.add("login", (username: string, password: string) => {
  cy.log(`Logging in the user: ${username}:${password}`);
  cy.visit("/");
  cy.get("input[id='username']").type(username);
  cy.get("input[id='password']").type(password);
  cy.get("button").contains("Login").click();
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
  cy.task("readFileMaybe", "cypress/fixtures/token.json").then(
    (tkn: string) => {
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
    }
  );
});

Cypress.Commands.add(
  "awaitUrl",
  (url: string, disableLoginVerification = false) => {
    cy.intercept(/fontawesome/).as("fontawesome");
    cy.intercept(/currentuser/).as("currentuser");
    cy.visit(url);
    cy.wait("@fontawesome");
    disableLoginVerification
      ? cy.wait("@currentuser")
      : cy.wait("@currentuser").its("response.statusCode").should("eq", 200);
  }
);

Cypress.Commands.add("verifyNotification", (text) => {
  cy.get(".pnotify-container").should("exist").contains(text);
  return cy.get(".pnotify-container").click({ force: true });
});

Cypress.on("uncaught:exception", () => {
  // returning false here prevents Cypress from
  // failing the test
  return false;
});

/**
 * getAttached(selector)
 * getAttached(selectorFn)
 *
 * Waits until the selector finds an attached element, then yields it (wrapped).
 * selectorFn, if provided, is passed $(document). Don't use cy methods inside selectorFn.
 */
Cypress.Commands.add("getAttached", (selector) => {
  const getElement =
    typeof selector === "function" ? selector : ($d) => $d.find(selector);
  let $el = null;
  return cy
    .document()
    .should(($d) => {
      $el = getElement(Cypress.$($d));
      expect(Cypress.dom.isDetached($el)).to.be.false;
    })
    .then(() => cy.wrap($el));
});
