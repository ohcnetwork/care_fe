import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientConsultationPage } from "../../pageobject/Patient/PatientConsultation";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import PatientLogupdate from "../../pageobject/Patient/PatientLogupdate";
import PatientInvestigation from "../../pageobject/Patient/PatientInvestigation";
import PatientPrescription from "../../pageobject/Patient/PatientPrescription";

describe("Patient Log Update in Normal, Critical and TeleIcu", () => {
  const loginPage = new LoginPage();
  const patientConsultationPage = new PatientConsultationPage();
  const patientPage = new PatientPage();
  const patientLogupdate = new PatientLogupdate();
  const patientInvestigation = new PatientInvestigation();
  const patientPrescription = new PatientPrescription();
  const domicilaryPatient = "Dummy Patient 11";
  const patientCategory = "Moderate";
  const physicalExamination = "physical examination details";
  const otherExamination = "Other";
  const patientSystolic = "119";
  const patientDiastolic = "150";
  const patientModifiedSystolic = "120";
  const patientModifiedDiastolic = "145";
  const patientPulse = "152";
  const patientTemperature = "96.6";
  const patientRespiratory = "140";
  const patientSpo2 = "15";
  const patientRhythmType = "Regular";
  const patientRhythm = "Normal Rhythm";

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Create a Progress Note update | Edit the existing log | Verify it's reflection ", () => {
    patientPage.visitPatient("Dummy Patient 14");
    patientConsultationPage.clickEditConsultationButton();
    patientConsultationPage.selectPatientSuggestion("Domiciliary Care");
    cy.submitButton("Update Consultation");
    cy.verifyNotification("Consultation updated successfully");
    cy.closeNotification();
    patientLogupdate.clickLogupdate();
    // Create a doctors log update
    patientLogupdate.typePhysicalExamination(physicalExamination);
    patientLogupdate.selectRoundType("Progress Note");
    patientLogupdate.typeOtherDetails(otherExamination);
    patientConsultationPage.addPatientSymptoms(
      "ss",
      ["Breathlessness", "Dizziness"],
      "21062024",
    );
    patientLogupdate.selectPatientCategory(patientCategory);
    patientLogupdate.typeSystolic(patientSystolic);
    patientLogupdate.typeDiastolic(patientDiastolic);
    patientLogupdate.typePulse(patientPulse);
    patientLogupdate.typeTemperature(patientTemperature);
    patientLogupdate.typeRespiratory(patientRespiratory);
    patientLogupdate.typeSpo2(patientSpo2);
    patientLogupdate.selectRhythm(patientRhythmType);
    patientLogupdate.typeRhythm(patientRhythm);
    cy.get("#consciousness_level-2").click();
    // add a icd-11 diagnosis
    patientConsultationPage.selectPatientDiagnosis(
      "1A04",
      "add-icd11-diagnosis-as-confirmed",
    );
    // add a investigation
    patientInvestigation.clickAddInvestigation();
    patientInvestigation.selectInvestigation("Vitals (GROUP)");
    patientInvestigation.clickInvestigationCheckbox();
    patientInvestigation.selectInvestigationFrequency("6");
    // add a medicine for the patient
    patientPrescription.clickAddPrescription();
    patientPrescription.interceptMedibase();
    patientPrescription.selectMedicinebox();
    patientPrescription.selectMedicine("DOLO");
    patientPrescription.enterDosage("4");
    patientPrescription.selectDosageFrequency("Twice daily");
    cy.submitButton("Submit");
    cy.verifyNotification("Medicine prescribed");
    cy.closeNotification();
    // Submit the doctors log update
    cy.verifyNotification("Progress Note log created successfully");
    // view the existing
  });

  it("Create a new log teleicu update for a domicilary care patient", () => {
    patientPage.visitPatient("Dummy Patient 11");
    patientConsultationPage.clickEditConsultationButton();
    patientConsultationPage.selectPatientSuggestion("Domiciliary Care");
    cy.submitButton("Update Consultation");
    cy.verifyNotification("Consultation updated successfully");
    cy.closeNotification();
    patientLogupdate.clickLogupdate();
    patientLogupdate.typePhysicalExamination(physicalExamination);
    patientLogupdate.selectRoundType("Telemedicine");
    patientLogupdate.typeOtherDetails(otherExamination);
    // no symptoms for this patient
    patientLogupdate.selectPatientCategory(patientCategory);
    patientLogupdate.typeSystolic(patientSystolic);
    patientLogupdate.typeDiastolic(patientDiastolic);
    patientLogupdate.typePulse(patientPulse);
    patientLogupdate.typeTemperature(patientTemperature);
    patientLogupdate.typeRespiratory(patientRespiratory);
    patientLogupdate.typeSpo2(patientSpo2);
    patientLogupdate.selectRhythm(patientRhythmType);
    patientLogupdate.typeRhythm(patientRhythm);
    cy.get("#consciousness_level-2").click();
    cy.submitButton("Save");
    cy.verifyNotification("Telemedicine log created successfully");
  });

  it("Create a new brief update for a domicilary care patient and edit it", () => {
    patientPage.visitPatient(domicilaryPatient);
    patientConsultationPage.clickEditConsultationButton();
    patientConsultationPage.selectPatientSuggestion("Domiciliary Care");
    cy.submitButton("Update Consultation");
    cy.verifyNotification("Consultation updated successfully");
    cy.closeNotification();
    patientLogupdate.clickLogupdate();
    patientLogupdate.typePhysicalExamination(physicalExamination);
    patientLogupdate.typeOtherDetails(otherExamination);
    patientConsultationPage.addPatientSymptoms(
      "ss",
      ["Breathlessness", "Dizziness"],
      "21062024",
    );
    patientLogupdate.selectPatientCategory(patientCategory);
    patientLogupdate.typeSystolic(patientSystolic);
    patientLogupdate.typeDiastolic(patientDiastolic);
    patientLogupdate.typePulse(patientPulse);
    patientLogupdate.typeTemperature(patientTemperature);
    patientLogupdate.typeRespiratory(patientRespiratory);
    patientLogupdate.typeSpo2(patientSpo2);
    patientLogupdate.selectRhythm(patientRhythmType);
    patientLogupdate.typeRhythm(patientRhythm);
    cy.get("#consciousness_level-2").click();
    cy.submitButton("Save");
    cy.verifyNotification("Brief Update log created successfully");
    cy.closeNotification();
    // edit the card and verify the data.
    cy.contains("Daily Rounds").click();
    patientLogupdate.clickLogupdateCard("#dailyround-entry", patientCategory);
    cy.verifyContentPresence("#consultation-preview", [
      patientCategory,
      patientDiastolic,
      patientSystolic,
      physicalExamination,
      otherExamination,
      patientPulse,
      patientTemperature,
      patientRespiratory,
      patientSpo2,
      patientRhythm,
    ]);
    patientLogupdate.clickUpdateDetail();
    patientLogupdate.clickClearButtonInElement("#systolic");
    patientLogupdate.typeSystolic(patientModifiedSystolic);
    patientLogupdate.clickClearButtonInElement("#diastolic");
    patientLogupdate.typeDiastolic(patientModifiedDiastolic);
    cy.submitButton("Continue");
    cy.verifyNotification("Brief Update log updated successfully");
    cy.contains("Daily Rounds").click();
    patientLogupdate.clickLogupdateCard("#dailyround-entry", patientCategory);
    cy.verifyContentPresence("#consultation-preview", [
      patientModifiedDiastolic,
      patientModifiedSystolic,
    ]);
  });

  it("Create a new brief update for a admission patient and verify its reflection in cards", () => {
    patientPage.visitPatient("Dummy Patient 13");
    patientLogupdate.clickLogupdate();
    cy.verifyNotification("Please assign a bed to the patient");
    patientLogupdate.selectBed("Dummy Bed 6");
    cy.closeNotification();
    patientLogupdate.clickLogupdate();
    patientLogupdate.typePhysicalExamination(physicalExamination);
    patientLogupdate.typeOtherDetails(otherExamination);
    patientConsultationPage.addPatientSymptoms(
      "ss",
      ["Breathlessness", "Dizziness"],
      "21062024",
    );
    patientLogupdate.selectPatientCategory(patientCategory);
    patientLogupdate.typeSystolic(patientSystolic);
    patientLogupdate.typeDiastolic(patientDiastolic);
    patientLogupdate.typePulse(patientPulse);
    patientLogupdate.typeTemperature(patientTemperature);
    patientLogupdate.typeRespiratory(patientRespiratory);
    patientLogupdate.typeSpo2(patientSpo2);
    patientLogupdate.selectRhythm(patientRhythmType);
    patientLogupdate.typeRhythm(patientRhythm);
    cy.get("#consciousness_level-2").click();
    cy.submitButton("Save");
    cy.wait(2000);
    cy.verifyNotification("Brief Update log created successfully");
    // Verify the card content
    cy.get("#basic-information").scrollIntoView();
    cy.verifyContentPresence("#encounter-symptoms", ["Breathlessness"]);
  });

  it("Create a brief update to verify MEWS Score Functionality", () => {
    patientPage.visitPatient(domicilaryPatient);
    patientConsultationPage.clickEditConsultationButton();
    patientConsultationPage.selectPatientSuggestion("Domiciliary Care");
    cy.submitButton("Update Consultation");
    cy.verifyNotification("Consultation updated successfully");
    cy.closeNotification();
    patientLogupdate.clickLogupdate();
    // Verify the MEWS Score reflection
    patientLogupdate.selectPatientCategory(patientCategory);
    patientLogupdate.typeSystolic(patientSystolic);
    patientLogupdate.typeDiastolic(patientDiastolic);
    patientLogupdate.typePulse(patientPulse);
    patientLogupdate.typeTemperature(patientTemperature);
    patientLogupdate.typeRespiratory(patientRespiratory);
    cy.get("#consciousness_level-2").click();
    cy.submitButton("Save");
    cy.verifyNotification("Brief Update log created successfully");
    cy.closeNotification();
    cy.verifyContentPresence("#consultation-buttons", ["9"]);
    // Verify the Incomplete data will give blank info
    patientLogupdate.clickLogupdate();
    patientLogupdate.selectPatientCategory(patientCategory);
    patientLogupdate.typeSystolic(patientSystolic);
    patientLogupdate.typeDiastolic(patientDiastolic);
    patientLogupdate.typePulse(patientPulse);
    cy.submitButton("Save");
    cy.verifyNotification("Brief Update log created successfully");
    cy.closeNotification();
    cy.verifyContentPresence("#consultation-buttons", ["-"]);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
