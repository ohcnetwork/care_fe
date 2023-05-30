import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";

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
  });

  it("filter by emergency case", () => {
    ["yes", "no"].forEach((select) => {
      cy.get("[name='emergency']").select(select).wait(100);
      cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      cy.contains("Apply").click().wait("@shifting_filter");
      cy.contains("Filters").click();
    });
  });

  it("filter by antenatal", () => {
    ["yes", "no"].forEach((select) => {
      cy.get("[name='is_antenatal']").select(select);
      cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      cy.contains("Apply").click().wait("@shifting_filter");
      cy.contains("Filters").click();
    });
  });

  it("filter by upshift case", () => {
    ["yes", "no"].forEach((select) => {
      cy.get("[name='is_up_shift']").select(select);
      cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      cy.contains("Apply").click().wait("@shifting_filter");
      cy.contains("Filters").click();
    });
  });

  it("filter by disease status", () => {
    ["POSITIVE", "SUSPECTED", "NEGATIVE", "RECOVERED"].forEach((select) => {
      cy.get("[name='disease_status']").select(select);
      cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      cy.contains("Apply").click().wait("@shifting_filter");
      cy.contains("Filters").click();
    });
  });

  it("filter by patient phone number", () => {
    const phoneNumber = "9999999999";
    cy.intercept(/\/api\/v1\/shift/).as("shiftFilter");
    cy.get("[name='patient_phone_number']").type(phoneNumber);
    cy.contains("Apply").click();
    cy.wait("@shiftFilter").then((interception) => {
      expect(interception?.request?.query?.patient_phone_number).to.eq(
        `+91${phoneNumber}`
      );
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
    cy.contains("Filters").click({ force: true });
    cy.contains("Clear").click();
    cy.saveLocalStorage();
  });
});
