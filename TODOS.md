# TODOS

## Billing / MonetaryComponent

- [ ] **Backend validation for global_component** — Add Django/DRF serializer validation rejecting `global_component` on non-discount MonetaryComponent types. Frontend enforces this via discriminated union types, but direct API calls can bypass it.
  **Priority:** P2
  **Effort:** S
  **Depends on:** PR #16097 landing (establishes the frontend pattern)

## Infrastructure

- [ ] **Add Vitest unit test framework** — Set up Vitest as the unit test runner for care_fe. Currently only Playwright E2E tests exist. Pure utility functions (e.g., `isDiscountComponent`, `calculateTotalPrice`) cannot be unit tested without a test runner.
  **Priority:** P2
  **Effort:** M
  **Context:** Discovered during PR #16097 review — wanted to add unit tests for type guard functions but no test infrastructure exists.

## Completed
