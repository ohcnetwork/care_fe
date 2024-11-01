import { SampleTestPage } from "pageobject/Sample/SampleTestCreate";

describe("Sample Test", () => {
  const sampleTestPage = new SampleTestPage();
  const sampleTestType = "BA/ETA",
    icmrCategory = "Cat 0",
    icmrLabel = "Test Icmr Label";

  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
  });

  it("should request a new sample test", () => {
    sampleTestPage.visitPatientPage();
    sampleTestPage.visitPatientDashboardPage();
    sampleTestPage.visitSampleRequestPage();

    // Fill form fields
    sampleTestPage.selectSampleType(sampleTestType);
    sampleTestPage.selectIcmrCategory(icmrCategory);
    sampleTestPage.typeIcmrLabel(icmrLabel);

    // Submit the form
    sampleTestPage.submitForm();

    // Check for sample request notification and history
    sampleTestPage.clickOnNotification();
    sampleTestPage.checkRequestHistory();
  });

  it("should verify sample request on sample page", () => {
    sampleTestPage.visitSamplePage();
    sampleTestPage.searchPatientSample(sampleTestPage.patientName);
    sampleTestPage.patientSampleMustExist();
  });
});
