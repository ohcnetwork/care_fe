/// <reference types="cypress" />

const username = "devdistrictadmin";
const password = "Coronasafe@123";
const phone_number = "9" + parseInt(Math.random() * 10 ** 9).toString();
const emergency_phone_number = "9430123487";
let patient_url = "";

describe("Patient Creation", () => {
  before(() => {
    cy.login(username, password);
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.visit("http://localhost:4000");
  });

  it("Create", () => {
    cy.visit(
      "http://localhost:4000/facility/2fa3fceb-d54d-455d-949c-e64dde945168"
    );
    cy.get("[data-testid=add-patient-button]").click();
    cy.get("[data-testid=phone-number] input").type(phone_number);
    cy.get("[data-testid=date-of-birth] svg").click();
    cy.get("div").contains("1999").click();
    cy.get("span").contains("OK").click();
    cy.get("[data-testid=name] input").type("Test E2E User");
    cy.get("[data-testid=Gender] select").select("Male");
    cy.get("[data-testid=state] select").select("Kerala");
    cy.get("[data-testid=district] select").select("Ernakulam");
    cy.get("[data-testid=localbody] select").select("844");
    cy.get("[data-testid=current-address] textarea").type(
      "Test Patient Address"
    );
    cy.get("[data-testid=permanent-address] input").check();
    cy.get("[data-testid=ward-respective-lsgi] select").select("15015");
    cy.get("[data-testid=pincode] input").type("159015");
    cy.get("[data-testid=blood-group] select").select("O+");
    cy.get("[data-testid=emergency-phone-number] input").type(
      emergency_phone_number,
      { delay: 100 }
    );
    cy.get("[data-testid=pincode] input").click();
    cy.get("[data-testid=submit-button]").click();
    cy.url().should("include", "/consultation");
    cy.url().then((url) => {
      cy.log(url);
      patient_url = url.split("/").slice(0, -1).join("/");
      cy.log(patient_url);
    });
  });

  it("Dashboard", () => {
    cy.visit(patient_url);
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
    cy.visit(patient_url + "/update");
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
