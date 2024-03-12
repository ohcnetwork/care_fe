import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientConsultationPage } from "../../pageobject/Patient/PatientConsultation";

describe("Patient Log Update in Normal, Critical and TeleIcu", () => {
  const loginPage = new LoginPage();
  const patientConsultationPage = new PatientConsultationPage();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Create a new log normal update for a domicilary care patient", () => {
    cy.get("#name").type("Dummy Patient 11");
    cy.get("[data-cy='patient']").contains("Dummy Patient 11").click();
    patientConsultationPage.clickEditConsultationButton();
    cy.wait(5000);
    patientConsultationPage.selectPatientSuggestion("Domiciliary Care");
    cy.submitButton("Update Consultation");
    cy.verifyNotification("Consultation updated successfully");
    cy.get("#log-update").contains("Log Update").click();
    cy.get("#physical_examination_info")
      .click()
      .type("Physical Examination Info");
    cy.clickAndSelectOption("#patient_category", "Abnormal");
    cy.get("#other_details").click().type("Physical Examination Info");
    cy.clickAndMultiSelectOption("#additional_symptoms", "ASYMPTOMATIC");
    cy.searchAndSelectOption("#systolic", "119");
    cy.searchAndSelectOption("#diastolic", "150");
    cy.searchAndSelectOption("#pulse", "152");
    cy.searchAndSelectOption("#temperature", "95.6");
    cy.searchAndSelectOption("#resp", "150");
    cy.searchAndSelectOption("#ventilator_spo2", "15");
    cy.clickAndSelectOption("#rhythm", "Regular");
    cy.get("#rhythm_detail").click().type("Physical Examination Info");
    cy.get("#consciousness_level-2").click();
    cy.submitButton("Save");
    cy.verifyNotification("Consultation Updates details created successfully");
  });

  it("Create a new log teleicu update for a domicilary care patient", () => {
    cy.get("#name").type("Dummy Patient 11");
    cy.get("[data-cy='patient']").contains("Dummy Patient 11").click();
    patientConsultationPage.clickEditConsultationButton();
    cy.wait(5000);
    patientConsultationPage.selectPatientSuggestion("Domiciliary Care");
    cy.submitButton("Update Consultation");
    cy.verifyNotification("Consultation updated successfully");
    cy.get("#log-update").contains("Log Update").click();
    cy.get("#physical_examination_info")
      .click()
      .type("Physical Examination Info");
    cy.clickAndSelectOption("#patient_category", "Abnormal");
    cy.clickAndSelectOption("#rounds_type", "Telemedicine");
    cy.get("#other_details").click().type("Physical Examination Info");
    cy.clickAndMultiSelectOption("#additional_symptoms", "ASYMPTOMATIC");
    cy.searchAndSelectOption("#systolic", "119");
    cy.searchAndSelectOption("#diastolic", "150");
    cy.searchAndSelectOption("#pulse", "152");
    cy.searchAndSelectOption("#temperature", "95.6");
    cy.searchAndSelectOption("#resp", "150");
    cy.searchAndSelectOption("#ventilator_spo2", "15");
    cy.clickAndSelectOption("#rhythm", "Regular");
    cy.get("#rhythm_detail").click().type("Physical Examination Info");
    cy.get("#consciousness_level-2").click();
    cy.submitButton("Save");
    cy.verifyNotification("Consultation Updates details created successfully");
  });

  it("Create a new log normal update for a admission patient", () => {
    cy.get("#name").type("Dummy Patient 13");
    cy.get("[data-cy='patient']").contains("Dummy Patient 13").click();
    cy.get("#log-update").contains("Log Update").click();
    cy.verifyNotification("Please assign a bed to the patient");
    cy.searchAndSelectOption("input[name='bed']", "Dummy Bed 6");
    cy.submitButton("Move to bed");
    cy.get("#log-update").contains("Log Update").click();
    cy.closeNotification();
    cy.clickAndSelectOption("#patient_category", "Abnormal");
    cy.get("#physical_examination_info")
      .click()
      .type("Physical Examination Info");
    cy.get("#other_details").click().type("Physical Examination Info");
    cy.clickAndMultiSelectOption("#additional_symptoms", "ASYMPTOMATIC");
    cy.searchAndSelectOption("#systolic", "119");
    cy.searchAndSelectOption("#diastolic", "150");
    cy.searchAndSelectOption("#pulse", "152");
    cy.searchAndSelectOption("#temperature", "95.6");
    cy.searchAndSelectOption("#resp", "150");
    cy.searchAndSelectOption("#ventilator_spo2", "15");
    cy.clickAndSelectOption("#rhythm", "Regular");
    cy.get("#rhythm_detail").click().type("Physical Examination Info");
    cy.get("#consciousness_level-2").click();
    cy.submitButton("Save");
    cy.verifyNotification("Consultation Updates details created successfully");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
