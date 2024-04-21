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
  const patientDischargeReason1 = "Recovered";
  const patientDischargeReason2 = "Referred";
  //const patientDischargeReason3 = "Expired";
  //const patientDischargeReason4 = "LAMA";
  const patientDischargeAdvice = "Discharge Advice";
  const patientMedicine = "ZOLE";
  const referringFacility = "Dummy Shifting Center, Ernakulam";
  const referringFreetextFacility = "Aster Mims";

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
    patientPage.visitPatient("Dummy Patient 16");
    patientDischarge.clickDischarge();
    patientDischarge.selectDischargeReason(patientDischargeReason1);
    patientDischarge.typeDischargeNote(patientDischargeAdvice);
    // Prescribe a medicine for the patient
    patientPrescription.clickAddPrescription();
    patientPrescription.interceptMedibase();
    patientPrescription.selectMedicinebox();
    patientPrescription.selectMedicine(patientMedicine);
    patientPrescription.enterDosage("4");
    patientPrescription.selectDosageFrequency("Twice daily");
    cy.submitButton("Submit");
    cy.verifyNotification("Medicine prescribed");
    cy.wait(2000);
    cy.closeNotification();
    // submit the discharge pop-up
    cy.submitButton("Confirm Discharge");
    cy.wait(2000);
    cy.verifyNotification("Patient Discharged Successfully");
    cy.closeNotification();
    // Verify the dashboard and discharge information
    cy.verifyContentPresence("#discharge-information", [
      patientDischargeReason1,
      patientDischargeAdvice,
      patientMedicine,
    ]);
  });

  it("Discharge patient with referred reason to a facility", () => {
    patientPage.visitPatient("Dummy Patient 15");
    patientDischarge.clickDischarge();
    patientDischarge.selectDischargeReason(patientDischargeReason2);
    patientDischarge.typeDischargeNote(patientDischargeAdvice);
    // select a registrated facility from dropdown and clear
    patientDischarge.typeReferringFacility(referringFacility);
    patientDischarge.clickClearButton();
    // select a non-registered facility and perform the discharge
    patientDischarge.typeReferringFacility(referringFreetextFacility);
    cy.wait(3000);
    patientDischarge.typeDischargeNote(patientDischargeAdvice);
    cy.submitButton("Confirm Discharge");
    cy.wait(2000);
    cy.verifyNotification("Patient Discharged Successfully");
    cy.closeNotification();
    // Verify the dashboard and discharge information
    cy.verifyContentPresence("#discharge-information", [
      patientDischargeReason2,
      patientDischargeAdvice,
      referringFreetextFacility,
    ]);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
