import { SampleTestPage } from "pageobject/Sample/SampleTestCreate";
import { PatientPage } from "pageobject/Patient/PatientCreation";
import LoginPage from "pageobject/Login/LoginPage";

describe("Sample Test", () => {
  const sampleTestPage = new SampleTestPage();
  const patientPage = new PatientPage();
  const loginPage = new LoginPage();

  const patientName = "Dummy Patient 11";
  const sampleTestType = "BA/ETA";
  const icmrCategory = "Cat 0";
  const icmrLabel = "Test Icmr Label";
  const doctorName = "Dr. John Doe";
  const atypicalDetails = "Patient showing unusual symptoms";
  const diagnosis = "Suspected respiratory infection";
  const etiologyIdentified = "Bacterial infection suspected";
  const differentialDiagnosis = "Possibly a viral infection";
  const fastTrackReason =
    "The patient has a high risk of complications and requires immediate testing.";

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
  });

  it("should request a new sample test", () => {
    // Ensure patient list API is loaded before proceeding
    cy.awaitUrl("/patients");
    patientPage.visitPatient(patientName);
    cy.verifyAndClickElement("#patient-details", "Patient Details");
    sampleTestPage.interceptPatientDetailsAPI();
    sampleTestPage.verifyPatientDetailsResponse();

    // Ensure sample request API is loaded
    sampleTestPage.visitSampleRequestPage();

    // Fill form fields using helper functions
    sampleTestPage.selectSampleType(sampleTestType);
    sampleTestPage.selectIcmrCategory(icmrCategory);
    sampleTestPage.fillIcmrLabel(icmrLabel);
    sampleTestPage.fillFastTrackReason(fastTrackReason);
    sampleTestPage.fillDoctorName(doctorName);
    sampleTestPage.fillAtypicalPresentation(atypicalDetails);
    sampleTestPage.fillDiagnosis(diagnosis);
    sampleTestPage.fillEtiology(etiologyIdentified);
    sampleTestPage.fillDiffDiagnosis(differentialDiagnosis);
    sampleTestPage.checkHasSari();
    sampleTestPage.checkHasAri();
    sampleTestPage.checkIsUnusualCourse();

    // Submit the form and verify notification
    cy.submitButton("Confirm your request to send sample for testing");
    cy.verifyNotification("Sample test created successfully");

    // Check the updated request history
    sampleTestPage.interceptSampleTestReq();
    sampleTestPage.verifySampleTestReq();
    sampleTestPage.checkRequestHistory(fastTrackReason);

    // Ensure sample page API is loaded before proceeding
    cy.awaitUrl("/sample");

    sampleTestPage.searchPatientSample(patientName);
    sampleTestPage.interceptGetSampleTestReq();
    sampleTestPage.verifyGetSampleTestReq();
    sampleTestPage.verifyPatientName(patientName);
    sampleTestPage.clickOnSampleDetailsBtn();
    sampleTestPage.verifyGetSampleTestReq();
    sampleTestPage.verifyPatientTestDetails(
      patientName,
      fastTrackReason,
      diagnosis,
      differentialDiagnosis,
      etiologyIdentified,
    );
  });
});
