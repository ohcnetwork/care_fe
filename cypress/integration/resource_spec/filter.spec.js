/// <reference types="cypress" />

describe("Edit Profile Testing", () => {
  before(() => {
    cy.login("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.visit("http://localhost:4000");
    cy.get("a").contains("Resource").click();
    cy.url().should("include", "/resource");
    cy.contains("Filters").click();
  });

  it("filter by origin facility", () => {
    cy.get('[name="orgin_facility"]')
      .type("harsha")
      .wait(3000)
      .type("{downarrow}{enter}");
    cy.contains("Apply").click().wait(1000);
  });

  it("filter by resource approval facility", () => {
    cy.get('[name="approving_facility"]')
      .type("test")
      .wait(3000)
      .type("{downarrow}{enter}");
    cy.contains("Apply").click().wait(1000);
  });

  it("filter by assigned facility", () => {
    cy.get('[name="assigned_facility"]')
      .type("center")
      .wait(3000)
      .type("{downarrow}{enter}");
    cy.contains("Apply").click().wait(1000);
  });

  it("filter by ordering", () => {
    [
      "DESC Created Date",
      "ASC Modified Date",
      "DESC Modified Date",
      "ASC Created Date",
    ].forEach((select) => {
      cy.get('[name="ordering"]').select(select);
      cy.contains("Apply").click().wait(1000);
      cy.contains("Filters").click();
    });
    cy.contains("Cancel").click();
  });

  it("filter by emergency case", () => {
    ["yes", "no"].forEach((select) => {
      cy.get('[name="emergency"]').select(select);
      cy.contains("Apply").click().wait(1000);
      cy.contains("Filters").click();
    });
    cy.contains("Cancel").click();
  });

  it('filter by created date', () => {
    cy.get('[name="created_date_after"]').type('22/05/2020')
    cy.get('[name="created_date_before"]').type('09/09/2021')
    cy.contains("Apply").click().wait(1000);
  })

  it('filter by modified date', () => {
    cy.get('[name="modified_date_after"]').type('22/05/2020')
    cy.get('[name="modified_date_before"]').type('09/09/2021')
    cy.contains("Apply").click().wait(1000);
  })

  afterEach(() => {
    cy.contains("Filters").click();
    cy.contains("Clear Filters").click();
    cy.saveLocalStorage();
  });
});
