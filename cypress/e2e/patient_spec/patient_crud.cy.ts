import { cy, describe, it, afterEach } from "local-cypress";
import * as users from "../../fixtures/credentials.json";

let patient_url = "";

describe("Patient Creation", () => {
  const phone_number = "9" + parseInt((Math.random() * 10 ** 9).toString());
  const emergency_phone_number = "9430123487";
  const unique_user_num = parseInt((Math.random() * 10 ** 5).toString());
  users.forEach((user) => {
    it(`Create as ${user.username}`, () => {
      //login with credentials
      cy.loginByApi(user.username, user.password);
      cy.saveLocalStorage();
      cy.restoreLocalStorage();
      cy.awaitUrl("/patients");

      cy.intercept(/\/api\/v1\/facility/).as("getFacilities");

      if (user.username == "devdoctor") {
        cy.visit("/users");
        cy.get(".peer").type(user.username);
        cy.wait(500);
        cy.get("[data-cy=home-facility]").then(function ($elem) {
          const homeFacility = $elem.text();
          cy.visit("/patients");
          cy.get("button")
            .should("contain", "Add Patient Details")
            .contains("Add Patient Details")
            .click({ force: true });
          cy.wait("@getFacilities");
          cy.get("input[name='facilities']").type(homeFacility);
          cy.wait("@getFacilities");
        });
      } else {
        cy.get("button")
          .should("contain", "Add Patient Details")
          .contains("Add Patient Details")
          .click({ force: true });
        cy.wait("@getFacilities");
      }

      cy.get("input[name='facilities']").type("{downarrow}{enter}");
      cy.get("button").contains("Continue").click({ force: true });
      cy.get("[data-testid=phone-number] input").type(phone_number);
      cy.get("[data-testid=date-of-birth] svg").click();
      cy.get("div").contains("1999").click();
      cy.get("span").contains("OK").click();
      cy.get("[data-testid=name] input").type(
        "Test E2E User " + unique_user_num
      );
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
      cy.url().then((url: string) => {
        cy.log(url);
        patient_url = url.split("/").slice(0, -1).join("/");
        cy.log(patient_url);
      });
    });

    it(`Accessing patient dashboard as ${user.username}`, () => {
      cy.loginByApi(user.username, user.password);
      cy.saveLocalStorage();
      cy.restoreLocalStorage();
      cy.awaitUrl("/");

      cy.awaitUrl(patient_url);
      cy.url().should("include", "/patient/");
      cy.get("[data-testid=patient-dashboard]").should("contain", "22");
      cy.get("[data-testid=patient-dashboard]").should(
        "contain",
        "Test E2E User " + unique_user_num
      );
      cy.get("[data-testid=patient-dashboard]").should("contain", phone_number);
      cy.get("[data-testid=patient-dashboard]").should(
        "contain",
        emergency_phone_number
      );
      cy.get("[data-testid=patient-dashboard]").should("contain", "1999");
      cy.get("[data-testid=patient-dashboard]").should("contain", "O+");
    });

    it(`Edit as ${user.username}`, () => {
      cy.loginByApi(user.username, user.password);
      cy.saveLocalStorage();
      cy.restoreLocalStorage();
      cy.awaitUrl("/patients");

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
      cy.get("[data-testid=pincode] input").type("159111");
      cy.get("[data-testid=blood-group] select").select("B+");
      cy.get("[data-testid=emergency-phone-number] input").type(phone_number, {
        delay: 100,
      });
      cy.get("[data-testid=current-address] textarea").type(
        "Test Patient Address Modified"
      );
      cy.get("button[type='submit']").click();
    });

    it(`Add Doctors Notes as ${user.username}`, () => {
      cy.loginByApi(user.username, user.password);
      cy.saveLocalStorage();
      cy.restoreLocalStorage();
      cy.awaitUrl("/patients");

      cy.awaitUrl(patient_url + "/notes");
      cy.get("textarea").type("Test Doctor Note");
      cy.get("button").contains("Post Your Note").click({ force: true });
      cy.verifyNotification("Note added successfully");
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
    cy.get("[data-testid=pincode] input").type("159111");
    cy.get("[data-testid=blood-group] select").select("B+");
    cy.get("[data-testid=emergency-phone-number] input").type(phone_number, {
      delay: 100,
    });
    cy.get("[data-testid=current-address] textarea").type(
      "Test Patient Address Modified"
    );
    cy.get("button[type='submit']").click();
  });

  it("Doctors Notes", () => {
    cy.awaitUrl(patient_url + "/notes");
    cy.get("textarea").type("Test Doctor Note");
    cy.get("button").contains("Post Your Note").click({ force: true });
    cy.verifyNotification("Note added successfully");
  });

  it("Create consultation", () => {
    cy.awaitUrl(patient_url + "/consultation");
    cy.get("div[role='button']").select("COUGH");
    cy.get("div[role='button']").select("FEVER");
    cy.get("input#date-picker-dialog").click();
    cy.get("textarea[placeholder='Consultation Notes...'").type(
      "Test Consultation Note"
    );
    cy.get("input[name='ip_no']").type("1234567890");
    cy.get("button[type='submit']").click();
  });

  // it("Create log update", () => {
  //   cy.awaitUrl(patient_url + "/logs");
  //   cy.get("button").contains("Add Log").click({ force: true });
  //   cy.get("textarea").type("Test Log");
  //   cy.get("button").contains("Post Log").click({ force: true });
  //   cy.verifyNotification("Log added successfully");
  // });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
