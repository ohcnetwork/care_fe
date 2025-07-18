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
    .get("li[data-sonner-toast]", { timeout: 10000 })
    .should("be.visible")
    .find("div[data-title]")
    .should("contain", text)
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
  "typeAndVerifyOptionNotPresent",
  (selector: string, value: string, emptyMessage: string) => {
    cy.get(selector)
      .click()
      .then(() => {
        cy.get("[cmdk-input]")
          .should("be.visible")
          .type(value)
          .then(() => {
            cy.get("[cmdk-empty]")
              .should("be.visible")
              .and("contain", emptyMessage);
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
    reference?: string,
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

    // Selection logic based on whether reference is provided
    const listbox = cy.get('[role="listbox"]').find('[role="option"]');

    if (reference) {
      listbox.contains(reference).should("be.visible").click();
    } else {
      listbox.first().should("be.visible").click();
    }
  },
);

Cypress.Commands.add(
  "verifyAndClickElement",
  (element: string, reference: string | RegExp) => {
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
    .get("li[data-sonner-toast]", { timeout: 10000 })
    .first()
    .should("be.visible")
    .then(($toast) => {
      cy.wrap($toast)
        .find('button[aria-label="Close toast"]', { timeout: 5000 })
        .should("be.visible")
        .should("not.be.disabled")
        .click({ force: true });
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
  label?: string;
  message: string;
}

Cypress.Commands.add("verifyErrorMessages", (errors: ErrorMessageItem[]) => {
  errors.forEach(({ label, message }) => {
    if (label) {
      // Verify the label is present if provided
      cy.contains(label).scrollIntoView().should("be.visible");
    }
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
      inputField.click().clear();
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

Cypress.Commands.add(
  "selectComboboxDropdown",
  (labelText: string, value: string, unit?: string) => {
    cy.contains("label", labelText)
      .parent('[data-slot="form-item"]')
      .find("input")
      .click({ force: true })
      .type(value);
    if (unit) {
      cy.get('[role="option"]').contains(unit).click();
    } else {
      cy.get('[role="option"]').contains(value).click();
    }
  },
);

Cypress.Commands.add(
  "clickAndSelectOptionV2",
  (labelText: string, reference: string) => {
    cy.contains("label", labelText)
      .parent('[data-slot="form-item"]')
      .find('[type="button"]')
      .click();
    cy.get('[role="option"]').contains(reference).click();
  },
);

Cypress.Commands.add(
  "typeAndSelectOptionV2",
  (labelText: string, value: string) => {
    // Click to open the dropdown
    cy.contains("label", labelText)
      .parent('[data-slot="form-item"]')
      .find("[data-slot='popover-trigger']")
      .click()
      .scrollIntoView()
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
              .click();
          });
      });
  },
);

Cypress.Commands.add(
  "clearAndTypeIntoField",
  (selector: string, value: string) => {
    cy.get(selector)
      .scrollIntoView()
      .should("be.visible")
      .clear()
      .click()
      .type(value);
  },
);

Cypress.Commands.add("getFacilityIdAndNavigate", (path?: string) => {
  cy.url().then((url) => {
    const facilityId = url.split("/facility/")[1].split("/")[0];
    if (path) {
      cy.visit(`/facility/${facilityId}/${path}`);
    }
    cy.wrap(facilityId);
  });
});

// Custom command for clicking radio buttons
Cypress.Commands.add(
  "clickRadioButton",
  (labelText: string, buttonValue: string) => {
    cy.get("label").contains(labelText).scrollIntoView();
    cy.get("label")
      .contains(labelText)
      .parent()
      .within(() => {
        cy.get(`button[value='${buttonValue}']`).click();
      });
  },
);

// Enhanced command for clicking radio buttons in complex nested structures
Cypress.Commands.add(
  "clickRadioButtonByLabel",
  (labelText: string, buttonValue: string) => {
    cy.get("label").contains(labelText).scrollIntoView();
    // Find the label and navigate to the closest question container
    cy.get("label")
      .contains(labelText)
      .closest('[data-cy^="question-"]')
      .within(() => {
        cy.get(`button[value='${buttonValue}']`).click();
      });
  },
);
