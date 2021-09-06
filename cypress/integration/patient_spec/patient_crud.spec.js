/// <reference types="cypress" />

const username = "devdistrictadmin";
const password = "Coronasafe@123";
const phone_number = "9" + parseInt(Math.random() * 10 ** 9).toString();
const emergency_phone_number = "9430123487";
let patient_url = "";

describe("Patient Creation", () => {
  beforeEach(() => {
    cy.login(username, password);
  });

  it("Create", () => {
    cy.createPatient({
      name: "TEst",
      facility_id: "2fa3fceb-d54d-455d-949c-e64dde945168",
      phone_number,
      gender: "Male",
      state: "Kerala",
      district: "Ernakulam",
      localbody: "844",
      current_address: "Test Patient Address",
      permanent_address: "",
      bloodgroup: "O+",
      emergency_phone_number,
      pincode: "159015",
      dob: { year: "1995", month: "Feb", date: "13" },
      lsg: "15015",
    });
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
});
