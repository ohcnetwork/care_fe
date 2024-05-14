import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientConsultationPage } from "../../pageobject/Patient/PatientConsultation";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import PatientLogupdate from "../../pageobject/Patient/PatientLogupdate";

describe("Patient Log Update in Normal, Critical and TeleIcu", () => {
  const loginPage = new LoginPage();
  const patientConsultationPage = new PatientConsultationPage();
  const patientPage = new PatientPage();
  const patientLogupdate = new PatientLogupdate();
  const domicilaryPatient = "Dummy Patient 11";
  const patientCategory = "Abnormal";
  const additionalSymptoms = "ASYMPTOMATIC";
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

  it("Create a new log teleicu update for a domicilary care patient and verify the copy previous value function", () => {
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
    patientLogupdate.typeAdditionalSymptoms(additionalSymptoms);
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
    cy.verifyNotification(
      "Telemedicine Log Updates details created successfully"
    );
    // verify the copied previous value
    cy.closeNotification();
    patientLogupdate.clickLogupdate();
    patientLogupdate.clickCopyPreviousValue();
    patientLogupdate.selectPatientCategory(patientCategory);
    cy.submitButton("Save");
    cy.closeNotification();
    cy.verifyContentPresence("#physical_examination_info", [
      physicalExamination,
    ]);
    cy.verifyContentPresence("#rhythm_detail", [patientRhythm]);
    cy.submitButton("Continue");
    cy.verifyNotification("Normal Log Updates details updated successfully");
  });

  it("Create a new log normal update for a domicilary care patient and edit it", () => {
    patientPage.visitPatient(domicilaryPatient);
    patientConsultationPage.clickEditConsultationButton();
    patientConsultationPage.selectPatientSuggestion("Domiciliary Care");
    cy.submitButton("Update Consultation");
    cy.verifyNotification("Consultation updated successfully");
    cy.closeNotification();
    patientLogupdate.clickLogupdate();
    patientLogupdate.typePhysicalExamination(physicalExamination);
    patientLogupdate.typeOtherDetails(otherExamination);
    patientLogupdate.typeAdditionalSymptoms(additionalSymptoms);
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
    cy.verifyNotification("Normal Log Updates details created successfully");
    cy.closeNotification();
    // edit the card and verify the data.
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
    cy.verifyNotification("Normal Log Updates details updated successfully");
    patientLogupdate.clickLogupdateCard("#dailyround-entry", patientCategory);
    cy.verifyContentPresence("#consultation-preview", [
      patientModifiedDiastolic,
      patientModifiedSystolic,
    ]);
  });

  it("Create a new log normal update for a admission patient and verify its reflection in cards", () => {
    patientPage.visitPatient("Dummy Patient 13");
    patientLogupdate.clickLogupdate();
    cy.verifyNotification("Please assign a bed to the patient");
    patientLogupdate.selectBed("Dummy Bed 6");
    cy.closeNotification();
    patientLogupdate.clickLogupdate();
    patientLogupdate.typePhysicalExamination(physicalExamination);
    patientLogupdate.typeOtherDetails(otherExamination);
    patientLogupdate.typeAdditionalSymptoms(additionalSymptoms);
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
    cy.verifyNotification("Normal Log Updates details created successfully");
    // Verify the card content
    cy.get("#basic-information").scrollIntoView();
    cy.verifyContentPresence("#basic-information", [additionalSymptoms]);
  });

  it("Create a normal log update to verify MEWS Score Functionality", () => {
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
    cy.verifyNotification("Normal Log Updates details created successfully");
    cy.closeNotification();
    cy.verifyContentPresence("#consultation-buttons", ["9"]);
    // Verify the Incomplete data will give blank info
    patientLogupdate.clickLogupdate();
    patientLogupdate.selectPatientCategory(patientCategory);
    patientLogupdate.typeSystolic(patientSystolic);
    patientLogupdate.typeDiastolic(patientDiastolic);
    patientLogupdate.typePulse(patientPulse);
    cy.submitButton("Save");
    cy.verifyNotification("Normal Log Updates details created successfully");
    cy.closeNotification();
    cy.verifyContentPresence("#consultation-buttons", ["-"]);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
