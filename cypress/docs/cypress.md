# Cypress Guidelines

## Core Principles

- Create, use and modify Reusable Commands and Functions for Cypress as needed
- Provide Id for the elements using data-cy attributes
- When interacting with a button, verify the button is enabled and visible before interacting with it
- when interacting with a button,verify the text of the button is correct
- Use Page Object Model for Cypress
- Use built-in assertions for Cypress
- Use beforeEach, afterEach and all relevant hooks for Cypress on every test file

## Storage Management

- Use cy.saveLocalStorage() and cy.restoreLocalStorage() for Cypress
- If we are using same element id to verify presence, interact and assert, make a reusable structure for it

## API Testing

- Use cy.intercept() for Cypress to verify API calls
- Use waitUntil() for Cypress to wait for API calls to complete
- Never use cy.wait() for Cypress except for API responses

## Best Practices

- Keep tests independent and isolated
- Use meaningful test descriptions
- Follow AAA pattern (Arrange, Act, Assert)
- Use fixtures for test data
- Implement custom commands for repetitive actions
