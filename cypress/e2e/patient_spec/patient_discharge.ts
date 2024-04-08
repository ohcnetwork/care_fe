import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import PatientDischarge from "../../pageobject/Patient/PatientDischarge";
import PatientPrescription from "../../pageobject/Patient/PatientPrescription";

describe("Patient Discharge based on multiple reason", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const patientDischarge = new PatientDischarge();
  const patientPrescription = new PatientPrescription();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Discharge a recovered patient with all fields", () => {
    patientPage.visitPatient("Dummy Patient 6");
    patientDischarge.clickDischarge();
    patientDischarge.selectDischargeReason("Recovered");
    patientDischarge.typeDischargeNote("Discharge Advice");
    // Prescribe a medicine for the patient
    patientPrescription.clickAddPrescription();
    patientPrescription.interceptMedibase();
    patientPrescription.selectMedicinebox();
    patientPrescription.selectMedicine("ZOLE");
    patientPrescription.enterDosage("4");
    patientPrescription.selectDosageFrequency("Twice daily");
    cy.submitButton("Submit");
    cy.verifyNotification("Medicine prescribed");
    cy.submitButton();
    cy.verifyNotification("Patient Discharged Successfully");
    // Verify the dashboard and discharge information
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
