import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

const username = "devdistrictadmin";
const password = "Coronasafe@123";
const makePhoneNumber = () =>
  "99" + Math.floor(Math.random() * 99999999).toString();

const phone_number = makePhoneNumber();
const emergency_phone_number = makePhoneNumber();
const yearOfBirth = "2023";
let patient_url = "";

const calculateAge = () => {
  const currentYear = new Date().getFullYear();
  return currentYear - parseInt(yearOfBirth);
};

describe("Patient Creation", () => {
  before(() => {
    cy.loginByApi(username, password);
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/");
  });

  it("Create a patient", () => {
    cy.visit("/patients");
    cy.get("button").should("contain", "Add Patient Details");
    cy.get("button").contains("Add Patient Details").click({ force: true });
    cy.get("input[name='facilities']")
      .type("ABCD Hospital, Ernakulam")
      .then(() => {
        cy.get("[role='option']").contains("ABCD Hospital, Ernakulam").click();
      });
    cy.get("button").contains("Select").click({ force: true });
    cy.wait(1000);
    cy.get("[data-testid=phone-number] input")
      .first()
      .type(phone_number, { force: true });
    cy.wait(1000);
    cy.get("[data-testid=emergency-phone-number] input")
      .first()
      .type(emergency_phone_number, { force: true });
    cy.wait(1000);
    cy.get("[data-testid=date-of-birth] button").click();
    cy.get("div").contains("1").click();
    cy.get("[data-testid=name] input").type("Test E2E User");
    cy.get("[data-testid=Gender] button")
      .click()
      .then(() => {
        cy.get("[role='option']").contains("Male").click();
      });
    cy.get("[data-testid=state] button")
      .click()
      .then(() => {
        cy.get("[role='option']").contains("Kerala").click();
      });
    cy.get("[data-testid=district] button")
      .click()
      .then(() => {
        cy.get("[role='option']").contains("Ernakulam").click();
      });
    cy.get("[data-testid=localbody] button")
      .click()
      .then(() => {
        cy.get("[role='option']").first().click();
      });
    cy.get("[data-testid=current-address] textarea").type(
      "Test Patient Address"
    );
    cy.get("[data-testid=permanent-address] input").check();
    cy.get("[data-testid=ward-respective-lsgi] button")
      .click()
      .then(() => {
        cy.get("[role='option']").contains("1: PAZHAMTHOTTAM").click();
      });
    cy.get("h1").contains("COVID Details").click({ force: true });
    cy.get("select#test_type").select("ANTIGEN");
    cy.get("[name='is_vaccinated']").check();
    cy.get("[data-testid=pincode] input").type("159015");
    cy.get("[name=medical_history_check_1]").check();
    cy.get("[data-testid=blood-group] button")
      .click()
      .then(() => {
        cy.get("[role='option']").contains("O+").click();
      });
    cy.wait(1000);
    cy.get("button").get("[data-testid=submit-button]").click();
    cy.url().should("include", "/patient");
    cy.url().then((url) => {
      cy.log(url);
      patient_url = url.split("/").slice(0, -1).join("/");
      cy.log(patient_url);
    });
  });

  it("Dashboard", () => {
    cy.log(patient_url);
    cy.awaitUrl(patient_url);
    cy.url().should("include", "/facility/");
    cy.get("[data-testid=patient-dashboard]").should("contain", calculateAge());
    cy.get("[data-testid=patient-dashboard]").should(
      "contain",
      "Test E2E User"
    );
    cy.get("[data-testid=patient-dashboard]").should("contain", phone_number);
    cy.get("[data-testid=patient-dashboard]").should(
      "contain",
      emergency_phone_number
    );
    cy.get("[data-testid=patient-dashboard]").should("contain", "1999");
    cy.get("[data-testid=patient-dashboard]").should("contain", "O+");
  });

  it("Edit", () => {
    cy.awaitUrl(patient_url + "/update");
    cy.get("[data-testid=state] button").should("contain", "Kerala");
    cy.get("[data-testid=district] select").should("contain", "Ernakulam");
    cy.get("[data-testid=localbody] select").should("contain", "Alangad");
    cy.get("[data-testid=current-address] textarea").should(
      "contain",
      "Test Patient Address"
    );
    // cy.get("[data-testid=permanent-address] input").should("be.checked")
    cy.get("[data-testid=ward-respective-lsgi] select").should(
      "contain",
      "MANAKKAPADY"
    );
    cy.get("[data-testid=pincode] input").should("have.value", "159015");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
