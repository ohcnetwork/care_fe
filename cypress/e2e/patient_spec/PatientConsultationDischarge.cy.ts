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
  const patientDischargeReason3 = "Expired";
  const patientDischargeReason4 = "LAMA";
  const patientDischargeAdvice = "Discharge Advice";
  const patientMedicine = "ZOLE";
  const referringFacility = "Dummy Shifting Center, Ernakulam";
  const referringFreetextFacility = "Aster Mims";
  const patientDeathCause = "Cause Of Death";
  const doctorName = "Custom Doctor";

  before(() => {
    loginPage.loginAsDistrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Discharge a LAMA patient in the consultation", () => {
    patientPage.visitPatient("Discharge Patient One");
    patientDischarge.clickDischarge();
    patientDischarge.selectDischargeReason(patientDischargeReason4);
    cy.clickSubmitButton("Confirm Discharge");
    cy.clickSubmitButton("Acknowledge & Submit");
    cy.verifyNotification("Patient Discharged Successfully");
    cy.closeNotification();
    // Verify the consultation dashboard reflection
    cy.verifyContentPresence("#consultation-buttons", ["LAMA"]);
    // verify the discharge information card
    cy.verifyContentPresence("#discharge-information", [
      patientDischargeReason4,
    ]);
  });

  it("Discharge a expired patient in the consultation", () => {
    patientPage.visitPatient("Discharge Patient Two");
    patientDischarge.clickDischarge();
    patientDischarge.selectDischargeReason(patientDischargeReason3);
    patientDischarge.typeDischargeNote(patientDeathCause);
    patientDischarge.typeDoctorName(doctorName);
    cy.clickSubmitButton("Confirm Discharge");
    cy.clickSubmitButton("Acknowledge & Submit");
    cy.verifyNotification("Patient Discharged Successfully");
    cy.closeNotification();
    // Verify the consultation dashboard reflection
    cy.verifyContentPresence("#consultation-buttons", ["EXPIRED"]);
    // verify the discharge information card
    cy.verifyContentPresence("#discharge-information", [
      patientDischargeReason3,
      patientDeathCause,
      doctorName,
    ]);
  });

  it("Discharge patient with referred reason to a facility", () => {
    patientPage.visitPatient("Discharge Patient Three");
    patientDischarge.clickDischarge();
    patientDischarge.selectDischargeReason(patientDischargeReason2);
    patientDischarge.typeDischargeNote(patientDischargeAdvice);
    // select a registrated facility from dropdown and clear
    patientDischarge.typeReferringFacility(referringFacility);
    patientDischarge.clickClearButton();
    // select a non-registered facility and perform the discharge
    patientDischarge.typeReferringFacility(referringFreetextFacility);
    cy.wait(2000);
    cy.clickSubmitButton("Confirm Discharge");
    cy.clickSubmitButton("Acknowledge & Submit");
    cy.wait(2000);
    cy.verifyNotification("Patient Discharged Successfully");
    cy.closeNotification();
    // Verify the consultation dashboard reflection
    cy.verifyContentPresence("#consultation-buttons", ["Referred"]);
    // Verify the dashboard and discharge information
    cy.verifyContentPresence("#discharge-information", [
      patientDischargeReason2,
      patientDischargeAdvice,
      referringFreetextFacility,
    ]);
  });

  it("Discharge a recovered patient with all relevant fields", () => {
    patientPage.visitPatient("Discharge Patient Four");
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
    cy.clickSubmitButton("Submit");
    cy.verifyNotification("Medicine prescribed");
    cy.wait(2000);
    cy.closeNotification();
    // submit the discharge pop-up
    cy.clickSubmitButton("Confirm Discharge");
    cy.clickSubmitButton("Acknowledge & Submit");
    cy.wait(2000);
    cy.verifyNotification("Patient Discharged Successfully");
    cy.closeNotification();
    // Verify the consultation dashboard reflection
    cy.verifyContentPresence("#consultation-buttons", ["Recovered"]);
    // Verify the dashboard and discharge information
    cy.verifyContentPresence("#discharge-information", [
      patientDischargeReason1,
      patientDischargeAdvice,
      patientMedicine,
    ]);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
