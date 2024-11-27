import { PatientPage } from "pageobject/Patient/PatientCreation";
import PatientInvestigation from "pageobject/Patient/PatientInvestigation";

import LoginPage from "../../pageobject/Login/LoginPage";

describe("Patient Investigation Creation from Patient consultation page", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const patientInvestigation = new PatientInvestigation();
  const patientName = "Dummy Patient Thirteen";

  before(() => {
    loginPage.loginAsDistrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Create a investigation for a patient and verify its reflection", () => {
    patientPage.visitPatient(patientName);
    patientInvestigation.clickInvestigationTab();
    patientInvestigation.clickLogLabResults();
    patientInvestigation.selectInvestigationOption([
      "Haematology",
      "Urine Test",
    ]);
    cy.clickSubmitButton("Save Investigation");
    cy.verifyNotification("Please Enter at least one value");
    cy.closeNotification();
    // Temporary workflow for investigation since we dont have dummy data and moving away from existing module
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
