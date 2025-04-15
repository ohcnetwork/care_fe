import "cypress-localstorage-commands";

Cypress.Commands.add("loginByApi", (role: string) => {
  const sessionName = `login-${role}`;

  return cy.session(sessionName, () => {
    cy.visit("/login");
    cy.fixture("users").then((users) => {
      const user = users[role];
      if (!user) {
        throw new Error(`User role "${role}" not found in users fixture`);
      }

      cy.get('[data-cy="username"]').type(user.username);
      cy.get('[data-cy="password"]').type(user.password);
      cy.get('[data-cy="submit"]').click();

      // Wait for successful login
      cy.url().should("not.include", "/login");
    });
  });
});

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
  (selector: string, value: string, verify: boolean = true) => {
    // Click to open the dropdown
    cy.get(selector)
      .click()
      .then(() => {
        // Type in the command input
        cy.get("[cmdk-input]")
          .should("be.visible")
          .type(value)
          .then(() => {
            // Select the filtered option from command menu
            cy.get("[cmdk-group]")
              .find("[cmdk-item]")
              .contains(value)
              .should("be.visible")
              .click()
              .then(() => {
                // Verify the selected value is present in the selector (if verify is true)
                if (verify) {
                  cy.get(selector).should("contain", value);
                }
              });
          });
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
  "clickAndSelectOption",
  (
    element: string,
    reference: string,
    options: { position?: "first" | "last" } = {},
  ) => {
    // Click to open the select dropdown based on position
    if (options.position === "first") {
      cy.get(element).first().click();
    } else if (options.position === "last") {
      cy.get(element).last().click();
    } else {
      cy.get(element).click();
    }

    // Common selection logic
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

Cypress.Commands.add("saveCurrentUrl", () => {
  cy.url().then((url) => {
    cy.wrap(url).as("savedCurrentUrl");
  });
});

Cypress.Commands.add("navigateToSavedUrl", () => {
  cy.get<string>("@savedCurrentUrl").then((url) => {
    cy.visit(url);
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
      position?: "first" | "last";
    } = {},
  ) => {
    const {
      clearBeforeTyping = false,
      skipVerification = false,
      delay = 0,
      position,
    } = options;
    const inputField = cy.get(selector);

    if (clearBeforeTyping) {
      inputField.clear();
    }

    // Handle click based on position
    if (position === "first") {
      inputField.first().scrollIntoView().should("be.visible").click();
    } else if (position === "last") {
      inputField.last().scrollIntoView().should("be.visible").click();
    } else {
      inputField.scrollIntoView().should("be.visible").click();
    }

    inputField.type(value, { delay }).then(() => {
      if (!skipVerification) {
        cy.get(selector).should("have.value", value);
      }
    });
  },
);
