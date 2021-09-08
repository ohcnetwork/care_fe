/// <reference types="cypress" />

describe("Assets Manage", () => {
  beforeEach(() => {
    cy.login("devdistrictadmin", "Coronasafe@123");
    cy.contains("Assets", "a").click();
  });
});
