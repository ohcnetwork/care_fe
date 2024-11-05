import { PatientConsultationPage } from "pageobject/Patient/PatientConsultation";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import PatientInsurance from "pageobject/Patient/PatientInsurance";
import { HcxClaims } from "pageobject/Hcx/HcxClaims";

describe("HCX Claims configuration and approval workflow", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const patientConsultationPage = new PatientConsultationPage();
  const patientInsurance = new PatientInsurance();
  const hcxClaims = new HcxClaims();
  const hcxPatientName = "Dummy Patient 14";
  const firstInsuranceIdentifier = "insurance-details-0";
  const patientMemberId = "001";
  const patientPolicyId = "100";
  const patientInsurerName = "Demo Payor";

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Verify the HCX Workflow for a patient", () => {
    // Modify the insurance for a facility
    patientPage.visitPatient(hcxPatientName);
    patientConsultationPage.clickPatientDetails();
    patientPage.clickPatientUpdateDetails();
    patientInsurance.clickAddInsruanceDetails();
    patientInsurance.typePatientInsuranceDetail(
      firstInsuranceIdentifier,
      "subscriber_id",
      patientMemberId,
    );
    patientInsurance.typePatientInsuranceDetail(
      firstInsuranceIdentifier,
      "policy_id",
      patientPolicyId,
    );
    patientInsurance.selectHcxInsurer(patientInsurerName);
    cy.submitButton("Save Details");
    cy.verifyNotification("Patient updated successfully");
    patientConsultationPage.clickViewConsultationButton();
    // Raise a HCX Pre-auth
    patientConsultationPage.clickManagePatientButton();
    patientConsultationPage.clickClaimsButton();
    hcxClaims.selectEligiblePolicy(patientInsurerName);
    hcxClaims.verifyPolicyEligibity();
    cy.verifyNotification("Checking Policy Eligibility");
    cy.closeNotification();
    // Raise a HCX Claim
    // Approve the HCX from there website
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
