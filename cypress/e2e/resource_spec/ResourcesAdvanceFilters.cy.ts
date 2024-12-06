import LoginPage from "pageobject/Login/LoginPage";

const loginPage = new LoginPage();

describe("Resource filter", () => {
  before(() => {
    loginPage.loginByRole("districtAdmin");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/resource");
  });

  it("filter by origin facility", () => {
    cy.intercept(/\/api\/v1\/getallfacilities/).as("facilities_filter");
    cy.contains("Filters").click();
    cy.get("[name='origin_facility']")
      .type("Dummy Facility 40")
      .wait("@facilities_filter");
    cy.get("[role='option']").first().click();
    cy.contains("Apply").click();
  });

  it("filter by resource approval facility", () => {
    cy.intercept(/\/api\/v1\/getallfacilities/).as("facilities_filter");
    cy.contains("Filters").click();
    cy.get("[name='approving_facility']")
      .type("Dummy Shifting Center")
      .wait("@facilities_filter");
    cy.get("[role='option']").first().click();
    cy.contains("Apply").click();
  });

  it("filter by assigned facility", () => {
    cy.intercept(/\/api\/v1\/getallfacilities/).as("facilities_filter");
    cy.contains("Filters").click();
    cy.get("[name='assigned_facility']").type("Dummy Shifting Center");
    cy.wait("@facilities_filter");
    cy.get("[role='option']").first().click();
    cy.contains("Apply").click();
  });

  it("filter by ordering", () => {
    [
      "DESC Created Date",
      "ASC Modified Date",
      "DESC Modified Date",
      "ASC Created Date",
    ].forEach((option) => {
      cy.contains("Filters").click();
      cy.get("div [id='ordering'] > div > button").click();
      cy.get("li").contains(option).click();
      cy.intercept(/\/api\/v1\/resource/).as("resource_filter");
      cy.contains("Apply").click().wait("@resource_filter");
    });
  });

  it("filter by emergency case", () => {
    ["yes", "no"].forEach((option) => {
      cy.contains("Filters").click();
      cy.get("div [id='emergency'] > div > button").click();
      cy.get("li").contains(option).click();
      cy.intercept(/\/api\/v1\/resource/).as("resource_filter");
      cy.contains("Apply").click().wait("@resource_filter");
    });
  });

  it("filter by created date", () => {
    cy.intercept(/\/api\/v1\/resource/).as("resource_filter");
    cy.contains("Filters").click();
    cy.get("input[name='created_date_start']").click();
    cy.get("#date-1").click();
    cy.get("#date-1").click();
    cy.contains("Apply").click();
    cy.wait("@resource_filter");
  });

  it("filter by modified date", () => {
    cy.intercept(/\/api\/v1\/resource/).as("resource_filter");
    cy.contains("Filters").click();
    cy.get("input[name='modified_date_start']").click();
    cy.get("#date-1").click();
    cy.get("#date-1").click();
    cy.contains("Apply").click();
    cy.wait("@resource_filter");
  });

  afterEach(() => {
    cy.clearAllFilters();
    cy.saveLocalStorage();
  });
});
