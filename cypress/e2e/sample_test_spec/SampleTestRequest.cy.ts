import { SampleTestPage } from "pageobject/Sample/SampleTestCreate";

describe("Sample Test", () => {
  const sampleTestPage = new SampleTestPage();
  const smapleTestType = "BA/ETA",
    icmrCategory = "Cat 0",
    icmrLabel = "Test Icmr Label";

  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("request for new sample test", () => {
    sampleTestPage.visitPatientDashboardPage();
    sampleTestPage.visitSampleRequestPage();

    // Filling the form fields
    sampleTestPage.selectSampleType(smapleTestType);
    sampleTestPage.selectIcmrCategory(icmrCategory);
    sampleTestPage.typeIcmrLabel(icmrLabel);

    // Submit Form
    sampleTestPage.submitForm();

    // checking for sample request
    sampleTestPage.clickOnNotification();
    sampleTestPage.checkRequestHistory();
  });

  // it("check smaple request on sample page", () => {
  //   cy.awaitUrl("/sample")
  // })
});
