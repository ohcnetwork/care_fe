// commands.ts

import "cypress-localstorage-commands";

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
      cy.wrap({
        username: username,
        access: response.body.access,
        refresh: response.body.refresh,
      }).as("authToken"); // Store the tokens as an alias for later use
      cy.setLocalStorage("care_access_token", response.body.access);
      cy.setLocalStorage("care_refresh_token", response.body.refresh);
    } else {
      cy.log("An error occurred while logging in");
    }
  });
});

Cypress.Commands.add("loginByApi", (username, password) => {
  cy.log(`Logging in the user: ${username}:${password}`);

  const loginAndSetTokens = () => {
    // Log in the user and get the access and refresh tokens
    cy.refreshApiLogin(username, password).then(() => {
      cy.getLocalStorage("care_access_token").then((access) => {
        cy.setLocalStorage("care_access_token", access);
        cy.getLocalStorage("care_refresh_token").as("refreshToken"); // Store the refresh token as an alias for later use
      });
    });
  };

  // Check if the tokens exist in local storage and if they are valid
  cy.getLocalStorage("care_access_token")
    .then((access) => {
      if (access) {
        // If the access token exists, verify it with the server
        cy.request({
          method: "POST",
          url: "/api/v1/auth/token/verify/",
          body: {
            token: access,
          },
          headers: {
            "Content-Type": "application/json",
          },
          failOnStatusCode: false,
        }).then((response) => {
          if (response.status === 403) {
            // If the access token is invalid or expired, log in the user again
            loginAndSetTokens();
          } else if (response.status === 200) {
            // If the access token is valid, set the tokens in local storage
            cy.setLocalStorage("care_access_token", access);
            cy.getLocalStorage("care_refresh_token").as("refreshToken"); // Store the refresh token as an alias for later use
          }
        });
      } else {
        // If the access token does not exist, log in the user
        loginAndSetTokens();
      }
    })
    .then(() => {
      // Set the refresh token from the alias to local storage
      cy.get("@refreshToken").then((refresh) => {
        if (refresh) {
          cy.setLocalStorage("care_refresh_token", refresh);
        }
      });
    });
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
