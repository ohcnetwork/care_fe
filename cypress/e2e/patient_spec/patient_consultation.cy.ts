import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import { PatientConsultationPage } from "../../pageobject/Patient/PatientConsultation";

describe("Patient Creation with consultation", () => {
  const patientConsultationPage = new PatientConsultationPage();
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Create a patient with consultation in combination OP + Admission + All Fields", () => {
    patientPage.interceptFacilities();
    patientPage.visitConsultationPage();
    patientPage.verifyStatusCode();
    patientConsultationPage.fillIllnessHistory("history");
    patientConsultationPage.selectConsultationStatus(
      "Outpatient/Emergency Room"
    );
    patientConsultationPage.selectSymptoms("ASYMPTOMATIC");

    patientConsultationPage.enterConsultationDetails(
      "Stable",
      "Examination details and Clinical conditions",
      "70",
      "170",
      "IP007",
      "generalnote",
      "Dev Doctor"
    );
    patientConsultationPage.submitConsultation();

    // Below code for the prescription module only present while creating a new consultation
    patientConsultationPage.clickAddPrescription();
    patientConsultationPage.interceptMediaBase();
    patientConsultationPage.selectMedicinebox();
    patientConsultationPage.waitForMediabaseStatusCode();
    patientConsultationPage.prescribefirstMedicine();
    patientConsultationPage.enterDosage("3");
    patientConsultationPage.selectDosageFrequency("Twice daily");
    patientConsultationPage.submitPrescriptionAndReturn();
  });

  it("Edit created consultation to existing patient", () => {
    patientPage.visitPatientUrl();
    patientConsultationPage.visitEditConsultationPage();
    patientConsultationPage.fillIllnessHistory("editted");
    patientConsultationPage.updateSymptoms("FEVER");
    patientConsultationPage.setSymptomsDate("01082023");
    patientConsultationPage.updateConsultation();
    patientConsultationPage.verifySuccessNotification(
      "Consultation updated successfully"
    );
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
