import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

const username = "devdistrictadmin";
const password = "Coronasafe@123";
const phone_number = "9" + parseInt((Math.random() * 10 ** 9).toString());
const emergency_phone_number = "9430123487";
let patient_url = "";

describe("Patient Creation", () => {
  before(() => {
    cy.loginByApi(username, password);
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/");
  });

  it("Create", () => {
    cy.get("[name='facility-details']").first().click();
    cy.get("button").should("contain", "Add Details of a Patient");
    cy.get("button")
      .contains("Add Details of a Patient")
      .click({ force: true });
    cy.get("[data-testid=phone-number] input").type(phone_number);
    cy.get("[data-testid=date-of-birth] svg").click();
    cy.get("div").contains("1999").click();
    cy.get("span").contains("OK").click();
    cy.get("[data-testid=name] input").type("Test E2E User");
    cy.get("[data-testid=Gender] select").select("Male");
    cy.get("[data-testid=state] select").select("Kerala");
    cy.get("[data-testid=district] select").select("Ernakulam");
    cy.get("[data-testid=localbody] select").select(
      "Alangad  Block Panchayat, Ernakulam District"
    );
    cy.get("[data-testid=current-address] textarea").type(
      "Test Patient Address"
    );
    cy.get("[data-testid=permanent-address] input").check();
    cy.get("[data-testid=ward-respective-lsgi] select").select(
      "1: MANAKKAPADY"
    );
    cy.get("h1").contains("Health Details").click({ force: true });
    cy.get("select#test_type").select("ANTIGEN");
    cy.get("[name='is_vaccinated']").check();
    cy.get("[data-testid=pincode] input").type("159015");
    cy.get("[data-testid=blood-group] select").select("O+");
    cy.get("[data-testid=emergency-phone-number] input").type(
      emergency_phone_number,
      { delay: 100 }
    );
    cy.wait(1000);
    cy.get("button").get("[data-testid=submit-button]").click();
    cy.url().should("include", "/consultation");
    cy.url().then((url) => {
      cy.log(url);
      patient_url = url.split("/").slice(0, -1).join("/");
      cy.log(patient_url);
    });
  });

  it("Dashboard", () => {
    cy.awaitUrl(patient_url);
    cy.url().should("include", "/patient/");
    cy.get("[data-testid=patient-dashboard]").should("contain", "22");
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
    cy.get("[data-testid=state] select").should("contain", "Kerala");
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
