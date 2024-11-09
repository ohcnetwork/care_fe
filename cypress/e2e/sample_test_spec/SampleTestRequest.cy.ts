import LoginPage from "pageobject/Login/LoginPage";
import { PatientConsultationPage } from "pageobject/Patient/PatientConsultation";
import { PatientPage } from "pageobject/Patient/PatientCreation";
import { SampleTestPage } from "pageobject/Sample/SampleTestCreate";

describe("Sample Test", () => {
  const sampleTestPage = new SampleTestPage();
  const patientPage = new PatientPage();
  const loginPage = new LoginPage();
  const patientConsultationPage = new PatientConsultationPage();
  const patientName = "Dummy Patient 11";
  const sampleTestType = "BA/ETA";
  const icmrCategory = "Cat 0";
  const icmrLabel = "Test Icmr Label";
  const doctorName = "Dr John Doe";
  const atypicalDetails = "Patient showing unusual symptoms";
  const diagnosis = "Suspected respiratory infection";
  const etiologyIdentified = "Bacterial infection suspected";
  const differentialDiagnosis = "Possibly a viral infection";
  const fastTrackReason =
    "The patient has a high risk of complications and requires immediate testing.";
  const sampleTestStatus = "Request Submitted";
  const expectedSampleTestType = "ba/eta";
  const sampleTestResult = "Awaiting";

  before(() => {
    loginPage.loginAsDistrictAdmin();
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
    patientConsultationPage.interceptPatientDetailsAPI();
    patientConsultationPage.clickPatientDetails();
    patientConsultationPage.verifyPatientDetailsResponse();
    // Visit SampleRequest Page
    sampleTestPage.visitSampleRequestPage();
    // Fill Sample Test Request Form
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
    sampleTestPage.interceptSampleTestReq();
    cy.verifyNotification("Sample test created successfully");
    sampleTestPage.verifySampleTestReq();
    // Check the updated request history
    sampleTestPage.checkRequestHistory(
      sampleTestStatus,
      expectedSampleTestType,
      fastTrackReason,
      sampleTestResult,
    );
    // Checking Reflection on Sample Page
    cy.awaitUrl("/sample");
    sampleTestPage.interceptGetSampleTestReq();
    sampleTestPage.searchPatientSample(patientName);
    sampleTestPage.verifyGetSampleTestReq();
    sampleTestPage.verifyPatientName(patientName);
    sampleTestPage.interceptGetSampleTestReq();
    sampleTestPage.clickOnSampleDetailsBtn();
    sampleTestPage.verifyGetSampleTestReq();
    sampleTestPage.verifyPatientTestDetails(
      patientName,
      fastTrackReason,
      doctorName,
      diagnosis,
      differentialDiagnosis,
      etiologyIdentified,
    );
  });
});
