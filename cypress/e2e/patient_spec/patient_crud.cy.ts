import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";

const username = "devdistrictadmin";
const password = "Coronasafe@123";
const phone_number = "9" + parseInt((Math.random() * 10 ** 9).toString());
const emergency_phone_number = "9430123487";
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
    cy.awaitUrl("/patients");
  });

  it("Create a patient", () => {
    cy.get("button").should("contain", "Add Patient Details");
    cy.get("#add-patient-div").click();
    cy.get("input[name='facilities']")
      .type("ABCD Hospital, Ernakulam")
      .then(() => {
        cy.get("[role='option']").contains("ABCD Hospital, Ernakulam").click();
      });
    cy.get("button").should("contain", "Select");
    cy.get("button").get("#submit").click();
    cy.get("#phone_number-div").type(phone_number);
    cy.get("#emergency_phone_number-div").type(emergency_phone_number);
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
    cy.get("button").contains("COVID Details").click();
    cy.get("select#test_type").select("ANTIGEN");
    cy.get("[name='is_vaccinated']").check();
    cy.get("[data-testid=pincode] input").type("159015");
    cy.get("[name=medical_history_check_1]").check();
    cy.get("[data-testid=blood-group] button")
      .click()
      .then(() => {
        cy.get("[role='option']").contains("O+").click();
      });
    cy.get("button").get("[data-testid=submit-button]").click();
    cy.get("h2").should("contain", "Create Consultation");
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
    cy.get("[data-testid=patient-dashboard]").should("contain", yearOfBirth);
    cy.get("[data-testid=patient-dashboard]").should("contain", "O+");
  });

  it("Edit", () => {
    cy.awaitUrl(patient_url + "/update");
    cy.get("[data-testid=state] button").should("contain", "Kerala");
    cy.get("[data-testid=district] button").should("contain", "Ernakulam");
    cy.get("[data-testid=localbody] button").should("contain", "Aikaranad");
    cy.get("[data-testid=current-address] textarea").should(
      "contain",
      "Test Patient Address"
    );
    cy.get("[data-testid=permanent-address] input").should("be.checked");
    cy.get("[data-testid=ward-respective-lsgi] button").should(
      "contain",
      "PAZHAMTHOTTAM"
    );
    cy.get("[data-testid=pincode] input").should("have.value", "159015");
    cy.get("button").get("[data-testid=submit-button]").click();
    cy.url().should("include", "/patient");
    cy.url().then((url) => {
      cy.log(url);
      patient_url = url.split("/").slice(0, -1).join("/");
      cy.log(patient_url);
    });
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
