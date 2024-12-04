import LoginPage from "pageobject/Login/LoginPage";

const loginPage = new LoginPage();

describe("Sample List", () => {
  before(() => {
    loginPage.loginByRole("districtAdmin");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/sample");
  });

  it("Search by District name", () => {
    cy.intercept(/\/api\/v1\/test_sample/).as("test_sample");
    cy.get("[name='district_name']").type("Test");
    cy.wait("@test_sample").its("response.statusCode").should("eq", 200);
    cy.url().should("include", "Test");
  });

  it("Search by Patient Name", () => {
    cy.intercept(/\/api\/v1\/test_sample/).as("test_sample");
    cy.get("[name='patient_name']").type("Test");
    cy.wait("@test_sample").its("response.statusCode").should("eq", 200);
    cy.url().should("include", "Test");
  });

  it("Update Sample Status", () => {
    cy.contains("UPDATE SAMPLE TEST STATUS").click();
  });

  it("View Sample Details", () => {
    cy.contains("Sample Details").click();
  });

  it("Next/Previous Page", () => {
    // only works for desktop mode
    cy.get("button")
      .should("contain", "Next")
      .contains("Next")
      .click({ force: true });
    cy.get("button")
      .should("contain", "Previous")
      .contains("Previous")
      .click({ force: true });
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
