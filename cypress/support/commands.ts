import "cypress-localstorage-commands";

const apiUrl = Cypress.env("API_URL");

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
    url: `${apiUrl}/api/v1/auth/login/`,
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
          url: `${apiUrl}/api/v1/auth/token/verify/`,
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
    },
  );
});

Cypress.Commands.add(
  "awaitUrl",
  (url: string, disableLoginVerification = false) => {
    cy.intercept(/getcurrentuser/).as("currentuser");
    cy.visit(url);
    disableLoginVerification
      ? cy.wait("@currentuser")
      : cy.wait("@currentuser").its("response.statusCode").should("eq", 200);
  },
);

Cypress.Commands.add("verifyNotification", (text) => {
  return cy.get(".pnotify-container").should("exist").contains(text);
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

Cypress.Commands.add("clearAllFilters", () => {
  return cy.get("#clear-all-filters").click();
});

Cypress.Commands.add("submitButton", (buttonText = "Submit") => {
  cy.get("button[type='submit']").contains(buttonText).scrollIntoView();
  cy.get("button[type='submit']").contains(buttonText).click();
});

Cypress.Commands.add(
  "searchAndSelectOption",
  (element: string, referance: string) => {
    cy.get(element)
      .click()
      .type(referance)
      .then(() => {
        cy.get("[role='option']").contains(referance).click();
      });
  },
);

Cypress.Commands.add(
  "clickAndMultiSelectOption",
  (selector: string, options: string | string[]) => {
    const optionArray = Array.isArray(options) ? options : [options];
    cy.get(selector)
      .click()
      .then(() => {
        optionArray.forEach((options) => {
          cy.get("[role='option']").contains(options).click();
        });
        cy.get(selector).find("#dropdown-toggle").click();
      });
  },
);
Cypress.Commands.add(
  "typeAndMultiSelectOption",
  (selector: string, input: string, options: string | string[]) => {
    const optionArray = Array.isArray(options) ? options : [options];
    cy.get(selector)
      .click()
      .type(input)
      .then(() => {
        optionArray.forEach((options) => {
          cy.get("[role='option']").contains(options).click();
        });
        cy.get(selector).find("#dropdown-toggle").click();
      });
  },
);

Cypress.Commands.add(
  "clickAndSelectOption",
  (element: string, reference: string) => {
    cy.get(element)
      .click()
      .then(() => {
        cy.get("[role='option']").contains(reference).click();
      });
  },
);

Cypress.Commands.add("selectRadioOption", (name: string, value: string) => {
  cy.get(`input[type='radio'][name='${name}'][value=${value}]`).click();
});

Cypress.Commands.add("clickAndTypeDate", (selector: string, date: string) => {
  cy.get(selector).scrollIntoView();
  cy.get(selector).click();
  cy.get("#date-input").click().type(date);
});

Cypress.Commands.add(
  "verifyAndClickElement",
  (element: string, reference: string) => {
    cy.get(element).scrollIntoView();
    cy.get(element).contains(reference).should("be.visible").click();
  },
);

Cypress.Commands.add("preventPrint", () => {
  cy.window().then((win) => {
    cy.stub(win, "print").as("verifyPrevent");
  });
});

Cypress.Commands.add("closeNotification", () => {
  cy.get(".pnotify")
    .should("exist")
    .each(($div) => {
      cy.wrap($div).click();
    });
});

Cypress.Commands.add("verifyContentPresence", (selector, texts) => {
  cy.get(selector).then(($el) => {
    texts.forEach((text) => {
      cy.wrap($el).should("contain", text);
    });
  });
});
