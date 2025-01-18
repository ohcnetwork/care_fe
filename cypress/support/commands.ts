import "cypress-localstorage-commands";

const LOCAL_STORAGE_MEMORY = {};

Cypress.Commands.add("loginByApi", (role: string) => {
  const token = LOCAL_STORAGE_MEMORY["care_token"];

  if (!token) {
    cy.fixture("users").then((users) => {
      const user = users[role];

      if (!user) {
        throw new Error(`User role "${role}" not found in users fixture`);
      }

      // First do UI login to get tokens
      cy.get('[data-cy="username"]').type(user.username);
      cy.get('[data-cy="password"]').type(user.password);
      cy.get('[data-cy="submit"]').click();

      // Verify successful login by checking we're not on login page
      cy.url().should("not.include", "/login");

      // Save session after successful login
      Object.keys(localStorage).forEach((key) => {
        LOCAL_STORAGE_MEMORY[key] = localStorage[key];
      });
    });
  } else {
    // If token exists, just restore the session
    Object.keys(LOCAL_STORAGE_MEMORY).forEach((key) => {
      localStorage.setItem(key, LOCAL_STORAGE_MEMORY[key]);
    });
  }
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
Cypress.Commands.add("getAttached", (selector: string) => {
  const getElement =
    typeof selector === "function"
      ? selector
      : ($d: JQuery<Document>) =>
          $d.find(selector) as unknown as JQuery<HTMLElement>;

  let $el: JQuery<HTMLElement> | null = null;

  return cy
    .document()
    .should(($d: Document) => {
      $el = getElement(Cypress.$($d));
      // Ensure $el is an HTMLElement before checking if it is detached
      if ($el.length && $el[0] instanceof HTMLElement) {
        expect(Cypress.dom.isDetached($el[0])).to.be.false; // Access the first HTMLElement
      } else {
        throw new Error("Element is not an HTMLElement or is detached.");
      }
    })
    .then(() => cy.wrap($el));
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

Cypress.Commands.add("verifyNotification", (text: string) => {
  return cy
    .get("li[data-sonner-toast] div[data-title]")
    .should("exist")
    .contains(text)
    .should("be.visible")
    .then(() => {
      cy.closeNotification();
    });
});

Cypress.Commands.add("clearAllFilters", () => {
  return cy.get("#clear-all-filters").click();
});

Cypress.Commands.add("clickSubmitButton", (buttonText = "Submit") => {
  cy.get("button[type='submit']").contains(buttonText).scrollIntoView();
  cy.get("button[type='submit']").contains(buttonText).click();
});

Cypress.Commands.add("clickCancelButton", (buttonText = "Cancel") => {
  cy.get("#cancel").contains(buttonText).scrollIntoView();
  cy.get("#cancel").contains(buttonText).click();
});

Cypress.Commands.add(
  "typeAndSelectOption",
  (selector: string, value: string) => {
    // Click to open the dropdown
    cy.get(selector).click();

    // Type in the command input
    cy.get("[cmdk-input]").should("be.visible").clear().type(value);

    // Select the filtered option from command menu
    cy.get("[cmdk-list]")
      .find("[cmdk-item]")
      .contains(value)
      .should("be.visible")
      .click();
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
  "clickAndSelectOption",
  (element: string, reference: string) => {
    // Click to open the select dropdown
    cy.get(element).click();

    // Select the option from the popover content
    cy.get('[role="listbox"]')
      .find('[role="option"]')
      .contains(reference)
      .should("be.visible")
      .click();
  },
);

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
  return cy
    .get("li[data-sonner-toast] div[data-title]")
    .first()
    .parents("li[data-sonner-toast]")
    .then(($toast) => {
      cy.wrap($toast)
        .find('button[aria-label="Close toast"]', { timeout: 5000 })
        .should("be.visible")
        .click();
    });
});

Cypress.Commands.add("verifyContentPresence", (selector, texts) => {
  cy.get(selector).then(($el) => {
    texts.forEach((text) => {
      cy.wrap($el).should("contain", text);
    });
  });
});

export interface ErrorMessageItem {
  label: string;
  message: string;
}

Cypress.Commands.add("verifyErrorMessages", (errors: ErrorMessageItem[]) => {
  errors.forEach(({ label, message }) => {
    // Verify the label is present
    cy.contains(label).scrollIntoView().should("be.visible");
    // Verify the error message is present
    cy.contains(message).scrollIntoView().should("be.visible");
  });
});

Cypress.Commands.add(
  "typeIntoField",
  (
    selector: string,
    value: string,
    options: {
      clearBeforeTyping?: boolean;
      skipVerification?: boolean;
      delay?: number;
    } = {},
  ) => {
    const {
      clearBeforeTyping = false,
      skipVerification = false,
      delay = 0,
    } = options;
    const inputField = cy.get(selector);

    if (clearBeforeTyping) {
      inputField.clear();
    }

    inputField
      .scrollIntoView()
      .should("be.visible")
      .click()
      .type(value, { delay })
      .then(() => {
        if (!skipVerification) {
          cy.get(selector).should("have.value", value);
        }
      });
  },
);
