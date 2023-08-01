import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";

const username = "devdistrictadmin";
const password = "Coronasafe@123";
const phone_number = "9" + Math.floor(100000000 + Math.random() * 900000000);
const emergency_phone_number = "9430123487";
const yearOfBirth = "2023";
let patient_url = "";

const calculateAge = () => {
  const currentYear = new Date().getFullYear();
  return currentYear - parseInt(yearOfBirth);
};

describe("Patient Creation with consultation", () => {
  before(() => {
    cy.loginByApi(username, password);
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/patients");
  });

  it("Create a new patient with no consultation", () => {
    cy.get("button").should("contain", "Add Patient Details");
    cy.get("#add-patient-div").click();
    cy.get("input[name='facilities']")
      .type("cypress facility")
      .then(() => {
        cy.get("[role='option']").first().click();
      });
    cy.get("button").should("contain", "Select");
    cy.get("button").get("#submit").click();
    cy.get("#phone_number-div").type(phone_number);
    cy.get("#emergency_phone_number-div").type(emergency_phone_number);
    cy.get("[data-testid=date-of-birth] button").click();
    cy.get("#date-1").click();
    cy.get("[data-testid=name] input").type("Test E2E User");
    cy.get("[data-testid=Gender] button")
      .click()
      .then(() => {
        cy.get("[role='option']").contains("Male").click();
      });
    cy.get("[data-testid=current-address] textarea").type(
      "Test Patient Address"
    );
    cy.get("[data-testid=permanent-address] input").check();
    cy.get("#pincode").type("682001");
    cy.get("[data-testid=localbody] button")
      .click()
      .then(() => {
        cy.get("[role='option']").first().click();
      });
    cy.get("[data-testid=ward-respective-lsgi] button")
      .click()
      .then(() => {
        cy.get("[role='option']").contains("1: PAZHAMTHOTTAM").click();
      });
    cy.get("[name=medical_history_check_1]").check();
    cy.get("[data-testid=blood-group] button")
      .click()
      .then(() => {
        cy.get("[role='option']").contains("O+").click();
      });
    cy.get("button[data-testid='submit-button']").click();

    cy.get("h2").should("contain", "Create Consultation");
    cy.url().should("include", "/patient");
    cy.url().then((url) => {
      cy.log(url);
      patient_url = url.split("/").slice(0, -1).join("/");
      cy.log(patient_url);
    });
  });

  it("Patient Detail verification post registration", () => {
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

  it("Edit the patient details", () => {
    cy.awaitUrl(patient_url + "/update");
    cy.get("[data-testid=name] input").clear();
    cy.get("[data-testid=name] input").type("Test E2E User Edited");
    cy.get("#emergency_phone_number-div")
      .clear()
      .then(() => {
        cy.get("#emergency_phone_number__country").select("IN");
      });
    cy.get("#emergency_phone_number-div").type("9120330220");
    cy.get("#address").clear().type("Test Patient Address Edited");
    cy.get("#present_health").type("Severe Cough");
    cy.get("#ongoing_medication").type("Paracetamol");
    cy.get("#allergies").type("Dust");
    cy.get("[name=medical_history_check_1]").uncheck();
    cy.get("[name=medical_history_check_2]").check();
    cy.get("#medical_history_2").type("2 months ago");
    cy.get("[name=medical_history_check_3]").check();
    cy.get("#medical_history_3").type("1 month ago");
    cy.get("button").get("[data-testid=add-insurance-button]").click();
    cy.get("#subscriber_id").type("SUB123");
    cy.get("#policy_id").type("P123");
    cy.get("#insurer_id").type("GICOFINDIA");
    cy.get("#insurer_name").type("GICOFINDIA");
    cy.get("button").get("[data-testid=submit-button]").click();
    cy.url().should("include", "/patient");
    cy.url().then((url) => {
      cy.log(url);
      patient_url = url.split("/").slice(0, -1).join("/");
      cy.log(patient_url);
    });
  });

  it("Patient Detail verification post edit", () => {
    cy.log(patient_url);
    cy.awaitUrl(patient_url);
    cy.url().should("include", "/facility/");
    cy.get("[data-testid=patient-dashboard]").should(
      "contain",
      "Test E2E User Edited"
    );
    cy.get("[data-testid=patient-dashboard]").should(
      "contain",
      "+919120330220"
    );
    const patientDetails_values: string[] = [
      "Test Patient Address Edited",
      "Severe Cough",
      "Paracetamol",
      "Dust",
      "Diabetes",
      "2 months ago",
      "Heart Disease",
      "1 month ago",
    ];

    patientDetails_values.forEach((value) => {
      cy.get("[data-testid=patient-details]").should("contain", value);
    });
  });

  it("Create a New consultation to existing patient", () => {
    cy.visit(patient_url + "/consultation");
    cy.get("#consultation_status")
      .click()
      .then(() => {
        cy.get("[role='option']").contains("Out-patient (walk in)").click();
      });
    cy.get("#symptoms")
      .click()
      .then(() => {
        cy.get("[role='option']").contains("ASYMPTOMATIC").click();
      });
    cy.get("#symptoms").click();
    cy.get("#history_of_present_illness").click().type("histroy");
    cy.get("#examination_details")
      .click()
      .type("Examination details and Clinical conditions");
    cy.get("#weight").click().type("70");
    cy.get("#height").click().type("170");
    cy.get("#ip_no").type("192.168.1.11");
    cy.get(
      "#icd11_diagnoses_object input[placeholder='Select'][role='combobox']"
    )
      .click()
      .type("1A");
    cy.wait(1000);
    cy.get("#icd11_diagnoses_object [role='option']")
      .contains("1A03 Intestinal infections due to Escherichia coli")
      .click();
    cy.get("#consultation_notes").click().type("generalnote");
    cy.get("#verified_by").click().type("generalnote");
    cy.get("#submit").click();
    // Below code for the prescription module only present while creating a new consultation
    cy.contains("button", "Add Prescription Medication")
      .should("be.visible")
      .click();
    cy.get("div#medicine_object input[placeholder='Select'][role='combobox']")
      .click()
      .type("dolo{enter}");
    cy.get("#dosage").type("3", { force: true });
    cy.get("#frequency")
      .click()
      .then(() => {
        cy.get("div#frequency [role='option']").contains("Twice daily").click();
      });
    cy.get("button#submit").should("be.visible").click();
    cy.get("[data-testid='return-to-patient-dashboard']").click();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
