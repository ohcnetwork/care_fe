# Cypress Guidelines

## File Structure

```
cypress/
├── docs/
│   └── cypress.md
├── e2e/                    # Test files grouped by modules
│   ├── patient/           # Patient module tests
│   │   ├── search.cy.ts
│   │   ├── create.cy.ts
│   │   └── edit.cy.ts
│   ├── facility/          # Facility module tests
│   │   ├── list.cy.ts
│   │   └── details.cy.ts
│   └── user/             # User module tests
│       ├── login.cy.ts
│       └── profile.cy.ts
├── fixtures/              # Test data files by module
│   ├── patient/
│   │   └── patient-data.json
│   └── facility/
│       └── facility-data.json
├── pageObject/           # Page Objects by module
│   ├── patient/
│   │   ├── SearchPage.ts
│   │   └── CreatePage.ts
│   ├── facility/
│   │   ├── ListPage.ts
│   │   └── DetailsPage.ts
│   └── utils/            # Common helpers and global functions
│       ├── CommonActions.ts     # Shared actions across pages
│       ├── CommonAssertions.ts  # Shared assertions
│       └── GlobalHelpers.ts     # Platform-wide utility functions
├── support/              # Core support files
│   ├── commands.ts      # Custom Cypress commands
│   ├── e2e.ts          # e2e test configuration
│   └── index.ts        # Main support file
└── tsconfig.json
```

## Support Files

- `commands.ts`: Custom Cypress commands and their TypeScript definitions
- `e2e.ts`: e2e specific configurations and imports
- `index.ts`: Main support file that loads commands and configurations

## Page Objects Utils

The `pageObjects/utils` folder contains:

- Common helper functions used across different page objects
- Global utility functions for platform-wide operations
- Shared assertions and verifications
- Reusable action patterns

## Module-based Organization

Each module (patient, facility, user, etc.) should have its own:

- Test files in `e2e/<module-name>/`
- Page Objects in `pageObjects/<module-name>/`
- Fixtures in `fixtures/<module-name>/`

This organization helps:

- Keep related tests and page objects together
- Maintain clear separation between module-specific and common utilities
- Enable better code reuse through common utilities
- Keep core support files focused and minimal

## Core Principles

- Create, use and modify Reusable Commands and Functions for Cypress as needed
- Provide Id for the elements using data-cy attributes
- When interacting with a button, verify the button is enabled and visible before interacting with it
- when interacting with a button, verify the text of the button is correct
- Use Page Object Model for Cypress
- Use built-in assertions for Cypress
- Use beforeEach, afterEach and all relevant hooks for Cypress on every test file

## File Naming Conventions

- Test files: `feature-name.cy.ts`
- Page Objects: `FeatureNamePage.ts`
- Custom Commands: `feature-name.ts`
- Fixtures: `feature-name-data.json`

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

### Code Editing Guidelines

- When suggesting code edits, provide only the relevant file and changes
- Don't create separate folders for each edit
- Keep the existing file structure intact
- Provide clear comments for what's being changed
