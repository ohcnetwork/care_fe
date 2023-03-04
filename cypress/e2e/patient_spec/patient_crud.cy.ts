/* eslint-disable i18next/no-literal-string */
import { cy, describe, it, afterEach } from "local-cypress";
import * as users from "../../fixtures/credentials.json";

let patient_url = "";
const yearOfBirth = "1999";

const calculateAge = () => {
  const currentYear = new Date().getFullYear();
  return currentYear - parseInt(yearOfBirth);
};

describe("Patient Creation", () => {
  users.forEach((user) => {
    const phone_number = "9" + parseInt((Math.random() * 10 ** 9).toString());
    const emergency_phone_number = "9430123487";
    const unique_user_num = parseInt((Math.random() * 10 ** 5).toString());
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
      cy.get("button").contains("Select").click({ force: true });
      cy.get("[data-testid=phone-number] input").type(phone_number);
      cy.get("#pincode").type("123456");
      cy.get("[data-testid=emergency-phone-number] input").type(
        emergency_phone_number
      );
      cy.get("[data-testid=date-of-birth] svg").click();
      cy.get("div").contains("1999").click({ force: true });
      cy.get("span").then(($span) => {
        if (
          $span.text() ==
          "Admit the patient record to your facility by adding the date of birth"
        ) {
          cy.get("span")
            .contains(
              "Admit the patient record to your facility by adding the date of birth"
            )
            .click({ force: true });
          cy.get("button").contains("Continue").click({ force: true });
        }
      });
      cy.get("span").contains("OK").click({ force: true });
      cy.get("[data-testid=name] input").type(
        "Test E2E User " + unique_user_num
      );
      cy.get("[data-testid=Gender] select").select("Male");
      cy.get("[data-testid=state] select").select("Kerala");
      cy.get("[data-testid=district] select").select("Ernakulam");
      cy.get("[data-testid=localbody] select").select(1);
      cy.get("[data-testid=current-address] textarea").type(
        "Test Patient Address"
      );
      cy.get("[data-testid=permanent-address] input").check();
      cy.get("[data-testid=ward-respective-lsgi] select").select(1);
      cy.get("#blood_group").select("O+");
      cy.get("[name=medical_history_check_1]").click();
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
      cy.get("[data-testid=patient-dashboard]").should(
        "contain",
        calculateAge()
      );
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
      cy.awaitUrl(patient_url + "/update");
      cy.get("[data-testid=state] select").should("contain", "Kerala");
      cy.get("[data-testid=district] select").should("contain", "Ernakulam");
      cy.get("[data-testid=current-address] textarea").should(
        "contain",
        "Test Patient Address"
      );
      cy.get("[data-testid=permanent-address] input").should("be.checked");
      cy.get("#pincode").should("have.value", "123456");
      cy.get("#pincode").type("159111");
      cy.get("#blood_group").select("B+");
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
      cy.awaitUrl(patient_url + "/notes");
      cy.get("textarea").type("Test Doctor Note");
      cy.get("button").contains("Post Your Note").click({ force: true });
      cy.verifyNotification("Note added successfully");
    });

    it(`Create consultation as ${user.username}`, () => {
      cy.loginByApi(user.username, user.password);
      cy.saveLocalStorage();
      cy.restoreLocalStorage();
      cy.awaitUrl(patient_url + "/consultation");
      cy.get("#symptoms").click();
      cy.get("body").type("{downarrow}{enter}");
      cy.get("#consultation_status button").click();
      cy.get("body").type("{downarrow}{downarrow}{enter}");
      cy.get("#consultation_notes").type("Test Consultation Note");
      cy.get("#ip_no").type("1234567890");
      cy.get("#verified_by").type("Test Doctor");
      cy.get("button[type='submit']").click();
    });
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
