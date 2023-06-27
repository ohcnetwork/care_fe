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
    cy.get("[name='origin_facility']")
      .wait(100)
      .type("Dummy")
      .wait("@facilities_filter");
    cy.get("[name='origin_facility']").wait(100).type("{downarrow}{enter}");
    cy.contains("Apply").click();
  });

  it("filter by assigned facility", () => {
    cy.intercept(/\/api\/v1\/getallfacilities/).as("facilities_filter");
    cy.get("[name='assigned_facility']")
      .wait(100)
      .type("Dummy")
      .wait("@facilities_filter");
    cy.get("[name='assigned_facility']").wait(100).type("{downarrow}{enter}");
    cy.contains("Apply").click();
  });

  it("filter by assigned to user", () => {
    cy.intercept(/\/api\/v1\/users/).as("users_filter");
    cy.get("[id='assigned-to']")
      .wait(100)
      .type("cypress")
      .wait("@users_filter");
    cy.get("[id='assigned-to']").wait(100).type("{downarrow}{enter}");
    cy.contains("Apply").click();

    // cy.intercept(/\/api\/v1\/users/).as("users_filter");
    // cy.get("[name='assigned_to']").type("cypress").wait("@users_filter");
    // cy.get("[name='assigned_to']").type("{downarrow}{enter}");
    // cy.contains("Apply").click();
  });

  it("filter by ordering", () => {
    [
      "DESC Created Date",
      "ASC Modified Date",
      "DESC Modified Date",
      "ASC Created Date",
    ].forEach((select) => {
      cy.get("[id='ordering'] > div > button")
        .click()
        .wait(100)
        .get("li")
        .contains(select)
        .click()
        .wait(100);
      cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      cy.contains("Apply").click().wait("@shifting_filter");
      cy.contains("Filters").click();
      // cy.get("[name='ordering']").select(select).wait(100);
      // cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      // cy.contains("Apply").click().wait("@shifting_filter");
      // cy.contains("Filters").click();
    });
  });

  it("filter by emergency case", () => {
    ["yes", "no"].forEach((select) => {
      cy.get("[id='emergency'] > div > button")
        .click()
        .wait(100)
        .get("li")
        .contains(select)
        .click()
        .wait(100);
      cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      cy.contains("Apply").click().wait("@shifting_filter");
      cy.contains("Filters").click();
      // cy.get("[name='emergency']").select(select).wait(100);
      // cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      // cy.contains("Apply").click().wait("@shifting_filter");
      // cy.contains("Filters").click();
    });
  });

  it("filter by antenatal", () => {
    ["yes", "no"].forEach((select) => {
      cy.get("[id='is-antenatal'] > div > button")
        .click()
        .wait(100)
        .get("li")
        .contains(select)
        .click()
        .wait(100);
      cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      cy.contains("Apply").click().wait("@shifting_filter");
      cy.contains("Filters").click();
      // cy.get("[name='is-antenatal']").select(select);
      // cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      // cy.contains("Apply").click().wait("@shifting_filter");
      // cy.contains("Filters").click();
    });
  });

  it("filter by upshift case", () => {
    ["yes", "no"].forEach((select) => {
      cy.get("[id='is-up-shift'] > div > button")
        .click()
        .wait(100)
        .get("li")
        .contains(select)
        .click()
        .wait(100);
      cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      cy.contains("Apply").click().wait("@shifting_filter");
      cy.contains("Filters").click();
      // cy.get("[name='is-up-shift']").select(select);
      // cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      // cy.contains("Apply").click().wait("@shifting_filter");
      // cy.contains("Filters").click();
    });
  });

  it("filter by disease status", () => {
    ["POSITIVE", "SUSPECTED", "NEGATIVE", "RECOVERED"].forEach((select) => {
      cy.get("[id='disease-status'] > div > button")
        .click()
        .wait(100)
        .get("li")
        .contains(select)
        .click()
        .wait(100);
      cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      cy.contains("Apply").click().wait("@shifting_filter");
      cy.contains("Filters").click();
      // cy.get("[name='disease_status']").select(select);
      // cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      // cy.contains("Apply").click().wait("@shifting_filter");
      // cy.contains("Filters").click();
    });
  });

  it("filter by breathlessness level", () => {
    ["NOT BREATHLESS", "MILD", "MODERATE", "SEVERE"].forEach((select) => {
      cy.get("[id='breathlessness-level'] > div > button")
        .click()
        .wait(100)
        .get("li")
        .contains(select)
        .click()
        .wait(100);
      cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      cy.contains("Apply").click().wait("@shifting_filter");
      cy.contains("Filters").click();
      // cy.get("[name='breathlessness_level']").select(select);
      // cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
      // cy.contains("Apply").click().wait("@shifting_filter");
      // cy.contains("Filters").click();
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
    cy.contains("Created Date")
      .parent()
      .within(() => {
        cy.get("input[placeholder='Start date']").click();
        cy.contains("1").click();
        cy.get("input[placeholder='End date']").click();
        cy.contains("21").click();
      });
    cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
    cy.contains("Apply").click().wait("@shifting_filter");
  });

  it("filter by modified date", () => {
    cy.contains("Modified Date")
      .parent()
      .within(() => {
        cy.get("input[placeholder='Start date']").click();
        cy.contains("1").click();
        cy.get("input[placeholder='End date']").click();
        cy.contains("21").click();
      });
    cy.intercept(/\/api\/v1\/shift/).as("shifting_filter");
    cy.contains("Apply").click().wait("@shifting_filter");
  });

  afterEach(() => {
    cy.contains("Filters").click({ force: true });
    cy.contains("Clear").click();
    cy.saveLocalStorage();
  });
});
