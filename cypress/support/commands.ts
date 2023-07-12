import "cypress-localstorage-commands";
import { cy, Cypress } from "local-cypress";

const TOKEN_JSON_PATH = "cypress/fixtures/token.json";

Cypress.Commands.add("login", (username: string, password: string) => {
  cy.log(`Logging in the user: ${username}:${password}`);
  cy.visit("/");
  cy.get("input[id='username']").type(username);
  cy.get("input[id='password']").type(password);
  cy.get("button").contains("Login").click();
  return cy.url().should("include", "/facility");
});

Cypress.Commands.add("fetchAccessToken", (username, password) => {
  return cy
    .request({
      method: "POST",
      url: "/api/v1/auth/login/",
      body: {
        username,
        password,
      },
      failOnStatusCode: false,
    })
    .then((response) => {
      if (response.status === 200) {
        return response.body.access;
      } else {
        cy.log("An error occurred while fetching the access token");
        return null;
      }
    });
});

Cypress.Commands.add("fetchRefreshToken", (username, password) => {
  return cy
    .request({
      method: "POST",
      url: "/api/v1/auth/login/",
      body: {
        username,
        password,
      },
      failOnStatusCode: false,
    })
    .then((response) => {
      if (response.status === 200) {
        return response.body.refresh;
      } else {
        cy.log("An error occurred while fetching the refresh token");
        return null;
      }
    });
});

Cypress.Commands.add("loginByApi", (username, password) => {
  cy.readFile(TOKEN_JSON_PATH).then((tokens) => {
    if (tokens && tokens.username === username) {
      cy.setLocalStorage("care_access_token", tokens.access);
      cy.setLocalStorage("care_refresh_token", tokens.refresh);
    } else {
      cy.fetchAccessToken(username, password).then((accessToken) => {
        if (accessToken) {
          cy.fetchRefreshToken(username, password).then((refreshToken) => {
            if (refreshToken) {
              const newTokens = {
                username: username,
                access: accessToken,
                refresh: refreshToken,
              };
              cy.writeFile(TOKEN_JSON_PATH, newTokens);
              cy.setLocalStorage("care_access_token", accessToken);
              cy.setLocalStorage("care_refresh_token", refreshToken);
            }
          });
        }
      });
    }
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
  return cy.get(".pnotify-container").click();
});

Cypress.on("uncaught:exception", () => {
  // returning false here prevents Cypress from
  // failing the test
  return false;
});

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
