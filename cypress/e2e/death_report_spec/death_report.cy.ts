import { before, beforeEach, cy, describe, it } from "local-cypress";

const user = { username: "devdistrictadmin", password: "Coronasafe@123" };
const address = "C-106,\nSector-H,\nAliganj,\nLucknow,\nUttar Pradesh";

describe("Death Report", () => {
  before(() => {
    cy.loginByApi(user.username, user.password);
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/");
    cy.intercept("**/api/v1/patient/**").as("getPatients");
    cy.get("#facility-patients").contains("Patients").click({ force: true });
    cy.url().should("include", "/patients");
    cy.wait("@getPatients").get("a[data-cy=patient]").first().click();
    cy.url().then((url) => {
      const patient_id = url.split("/")[6];
      cy.visit(`/death_report/${patient_id}`, {
        onBeforeLoad: (win) => {
          cy.stub(win, "print");
        },
      });
    });
  });

  it("Add Data And Submit " + user.username, () => {
    // Wait For Form Data To Prepopulate

    // Clear Exisiting Data And Fill New Data
    cy.get("input[name='name']").clear().type("Apurva Nagar");
    cy.get("input[name='age']").clear().type("20");
    cy.get("input[name='gender']").clear().type("Male");
    cy.get("textarea[name='address']").clear().type(address);
    cy.get("input[name='phone_number']").clear().type("+919919266674");
    cy.get("input[name='is_declared_positive']").clear().type("No");
    cy.get("input[name='date_declared_positive']")
      .clear({ force: true })
      .type("2021-12-01", { force: true });
    cy.get("input[name='test_type']").clear().type("Rapid Antigen");
    cy.get("input[name='date_of_test']")
      .clear({ force: true })
      .type("2021-12-01", { force: true });
    cy.get("input[name='date_of_result']")
      .clear({ force: true })
      .type("2021-12-01", { force: true });
    cy.get("input[name='hospital_tested_in']").clear().type("Apollo Hospital");
    cy.get("input[name='hospital_died_in']").clear().type("Apollo Hospital");
    cy.get("input[name='date_of_admission']")
      .clear({ force: true })
      .type("2021-12-01", { force: true });
    cy.get("input[name='date_of_death']")
      .clear({ force: true })
      .type("2021-12-01", { force: true });
    cy.get("input[name='comorbidities']").clear().type("awesomeness");
    cy.get("input[name='history_clinical_course']")
      .clear()
      .type("No cure for awesomeness");
    cy.get("input[name='brought_dead']").clear().type("No");
    cy.get("input[name='home_or_cfltc']").clear().type("-");
    cy.get("input[name='is_vaccinated']").clear().type("Yes");
    cy.get("input[name='kottayam_confirmation_sent']").clear().type("Yes");
    cy.get("input[name='kottayam_sample_date']")
      .clear({ force: true })
      .type("2021-12-01", { force: true });
    cy.get("input[name='cause_of_death']")
      .clear()
      .type("Too awesome for earth");
    cy.get("input[name='srf_id']").clear().type("123456");

    // See Preview Of Report
    cy.get("button").contains("Preview").click();

    // Print Death Report
    cy.get("button").contains("Print Death Report").click();
    cy.window().its("print").should("be.called");
  });
});
