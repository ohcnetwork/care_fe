# Testing Patterns

## Element Interaction

### Preferred Command Usage

```typescript
// Correct
cy.verifyAndClickElement('[data-cy="element"]', "Button Text");

// Avoid
cy.get('[data-cy="element"]').should("be.visible").click();
```

## Navigation Patterns

```typescript
// Good
navigateToGovernance(orgName: string) {
  cy.verifyAndClickElement('[data-cy="organization-list"]', orgName);
}

navigateToFacilitiesList() {
  cy.verifyAndClickElement('[data-cy="org-nav-facilities"]', "Facilities");
}
```

## Test Data Management

```typescript
// Constants for fixed values
const facilityType = "Primary Health Centre";

// Generator functions for dynamic data
const phoneNumber = generatePhoneNumber();
```

## Test Structure

```typescript
describe("Feature Name", () => {
  const page = new PageObject();
  const facilityType = "Primary Health Centre";
  const testData = generateTestData();

  beforeEach(() => {
    // Setup
  });

  it("should perform action", () => {
    page.navigateToGovernance("Government");
    page.navigateToFacilitiesList();
  });
});
```
