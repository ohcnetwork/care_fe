import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

describe("Shifting section filter", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/shifting");
    cy.get("button").should("contain", "Filters").contains("Filters").click();
  });

  it("filter by origin facility", () => {
    cy.intercept(/\/api\/v1\/getallfacilities/).as("facilities_filter");
    cy.get("[name='orgin_facility']").type("harsha").wait("@facilities_filter");
    cy.get("[name='orgin_facility']").type("{downarrow}{enter}");
    cy.contains("Apply").click();
  });

  it("filter by shifting approval facility", () => {
    cy.intercept(/\/api\/v1\/getallfacilities/).as("facilities_filter");
    cy.get("[name='shifting_approving_facility']")
      .type("test")
      .wait("@facilities_filter");
    cy.get("[name='shifting_approving_facility']").type("{downarrow}{enter}");
    cy.contains("Apply").click();
  });

  it("filter by assigned facility", () => {
    cy.intercept(/\/api\/v1\/getallfacilities/).as("facilities_filter");
    cy.get("[name='assigned_facility']")
      .type("center")
      .wait("@facilities_filter");
    cy.get("[name='assigned_facility']").type("{downarrow}{enter}");
    cy.contains("Apply").click();
  });

  it("filter by assigned to user", () => {
    cy.intercept(/\/api\/v1\/users/).as("users_filter");
    cy.get("[name='assigned_to']").type("test").wait("@users_filter");
    cy.get("[name='assigned_to']").type("{downarrow}{enter}");
    cy.contains("Apply").click();
  });

  it("filter by ordering", () => {
    [
      "DESC Created Date",
      "ASC Modified Date",
      "DESC Modified Date",
      "ASC Created Date",
    ].forEach((select) => {
      cy.get("[name='ordering']").select(select).wait(100);
      cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      cy.contains("Apply").click().wait("@shifting_filter");
      cy.contains("Filters").click();
    });
    cy.contains("Cancel").click();
  });

  it("filter by emergency case", () => {
    ["yes", "no"].forEach((select) => {
      cy.get("[name='emergency']").select(select).wait(100);
      cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      cy.contains("Apply").click().wait("@shifting_filter");
      cy.contains("Filters").click();
    });
    cy.contains("Cancel").click();
  });

  it("filter by antenatal", () => {
    ["yes", "no"].forEach((select) => {
      cy.get("[name='is_antenatal']").select(select);
      cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      cy.contains("Apply").click().wait("@shifting_filter");
      cy.contains("Filters").click();
    });
    cy.contains("Cancel").click();
  });

  it("filter by upshift case", () => {
    ["yes", "no"].forEach((select) => {
      cy.get("[name='is_up_shift']").select(select);
      cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      cy.contains("Apply").click().wait("@shifting_filter");
      cy.contains("Filters").click();
    });
    cy.contains("Cancel").click();
  });

  it("filter by disease status", () => {
    ["POSITIVE", "SUSPECTED", "NEGATIVE", "RECOVERED", "EXPIRED"].forEach(
      (select) => {
        cy.get("[name='disease_status']").select(select);
        cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
        cy.contains("Apply").click().wait("@shifting_filter");
        cy.contains("Filters").click();
      }
    );
    cy.contains("Cancel").click();
  });

  it("filter by patient phone number", () => {
    cy.contains("Cancel").click().wait(100);
    cy.contains(/^((\+91|91|0)[- ]{0,1})?[123456789]\d{9}$/)
      .invoke("text")
      .then((phoneNumber) => {
        cy.contains("Filters").click();
        cy.intercept(/\/api\/v1\/getallfacilities/).as("facilities_filter");
        cy.get("[placeholder='Patinet phone number']").type(phoneNumber);
        cy.contains("Apply").click().wait("@facilities_filter");
      });
  });

  it("filter by created date", () => {
    cy.get("[name='created_date_after']").type("22/05/2020");
    cy.get("[name='created_date_before']").type("09/09/2021");
    cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
    cy.contains("Apply").click().wait("@shifting_filter");
  });

  it("filter by modified date", () => {
    cy.get("[name='modified_date_after']").type("22/05/2020");
    cy.get("[name='modified_date_before']").type("09/09/2021");
    cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
    cy.contains("Apply").click().wait("@shifting_filter");
  });

  afterEach(() => {
    cy.get("span")
      .should("contain", "Filters")
      .contains("Filters")
      .click({ force: true });
    cy.get("a")
      .should("contain", "Clear Filters")
      .contains("Clear Filters")
      .click();
    cy.saveLocalStorage();
  });
});
