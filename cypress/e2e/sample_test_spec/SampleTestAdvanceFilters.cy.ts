import LoginPage from "pageobject/Login/LoginPage";

const loginPage = new LoginPage();

describe("Sample Filter", () => {
  before(() => {
    loginPage.loginByRole("districtAdmin");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/sample");
    cy.contains("Advanced Filters").click();
  });

  it("Filter by Status", () => {
    cy.get("#status").click();
    cy.get("li[role='option']")
      .contains(/^APPROVED$/)
      .click();
  });

  it("Filter by sample type", () => {
    cy.get("#sample_type").click();
    cy.get("li[role='option']")
      .contains(/^Biopsy$/)
      .click();
  });

  afterEach(() => {
    cy.intercept(/\/api\/v1\/test_sample/).as("sample_filter");
    cy.contains("Apply").click();
    cy.wait("@sample_filter");
    cy.saveLocalStorage();
  });
});
