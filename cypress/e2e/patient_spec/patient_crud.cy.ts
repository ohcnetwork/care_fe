import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import { UpdatePatientPage } from "../../pageobject/Patient/PatientUpdate";

const calculateAge = () => {
  const currentYear = new Date().getFullYear();
  return currentYear - parseInt(yearOfBirth);
};

describe("Patient Creation with consultation", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const updatePatientPage = new UpdatePatientPage();
  const phone_number = "9" + Math.floor(100000000 + Math.random() * 900000000);
  const emergency_phone_number = "9430123487";
  const yearOfBirth = "2023";

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/patients");
  });

  it("Create a new patient with no consultation", () => {
    patientPage.createPatient();
    patientPage.selectFacility("cypress facility");
    patientPage.enterPatientDetails(
      phone_number,
      emergency_phone_number,
      "Test E2E User",
      "Male",
      "Test Patient Address",
      "682001",
      "1: PAZHAMTHOTTAM",
      "O+"
    );
    patientPage.clickCreatePatient();

    patientPage.verifyPatientIsCreated();
    patientPage.saveCreatedPatientUrl();
  });

  it("Patient Detail verification post registration", () => {
    patientPage.visitCreatedPatient();
    const age = calculateAge();
    patientPage.verifyPatientDetails(
      age,
      "Test E2E User",
      phone_number,
      emergency_phone_number,
      yearOfBirth,
      "O+"
    );
  });

  it("Edit the patient details", () => {
    patientPage.visitUpdatePatientUrl();
    updatePatientPage.enterPatientDetails();
    updatePatientPage.clickUpdatePatient();

    updatePatientPage.verifyPatientUpdated();
    updatePatientPage.saveUpdatedPatientUrl();
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
      .type("dolo");
    cy.get("div#medicine_object [role='option']")
      .contains("DOLO")
      .should("be.visible")
      .click();
    cy.get("#dosage").click().type("3");
    cy.get("#frequency")
      .click()
      .then(() => {
        cy.get("div#frequency [role='option']").contains("Twice daily").click();
      });
    cy.get("button#submit").should("be.visible").click();
    cy.get("[data-testid='return-to-patient-dashboard']").click();
  });

  it("Edit consultation details of existing patient", () => {
    cy.visit(patient_url + "/consultation");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
