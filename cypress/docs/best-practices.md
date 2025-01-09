# Best Practices

## Test Independence
- Each test should be independent and isolated
- Clean up test data after tests
- Don't rely on the state from other tests

## API Testing
- Use cy.intercept() for API verification
- Use waitUntil() for API completion
- Avoid cy.wait() except for API responses

## Element Interaction
- Always verify element state before interaction
- Use data-cy attributes for selectors
- Verify button text before clicking

## Code Organization
- Keep tests focused and concise
- Follow AAA pattern (Arrange, Act, Assert)
- Use meaningful test descriptions

## Common Pitfalls to Avoid
- Redundant visibility checks with verifyAndClickElement
- Hardcoded values in page objects
- Unnecessary waits
- Test interdependencies

## Performance Considerations
- Minimize unnecessary API calls
- Use efficient selectors
- Batch similar operations 